import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface WeeklySummaryStateMachineProps {
  checkFunction: lambda.IFunction;
  fetchFunction: lambda.IFunction;
  generateWithAiFunction: lambda.IFunction;
  saveFunction: lambda.IFunction;
}

export class WeeklySummaryStateMachine extends Construct {
  public readonly stateMachine: sfn.StateMachine;
  public readonly triggerLambda: lambda.IFunction;

  constructor(
    scope: Construct,
    id: string,
    props: WeeklySummaryStateMachineProps
  ) {
    super(scope, id);

    // 각 Lambda 함수를 호출하는 Task 정의
    const checkTask = new tasks.LambdaInvoke(this, 'CheckSummaryTask', {
      stateName: 'CheckSummaryTask',
      lambdaFunction: props.checkFunction,
      outputPath: '$.Payload',
    });

    const fetchTask = new tasks.LambdaInvoke(this, 'FetchDataTask', {
      stateName: 'FetchDataTask',
      lambdaFunction: props.fetchFunction,
      outputPath: '$.Payload',
    });

    const generateWithAiTask = new tasks.LambdaInvoke(
      this,
      'GenerateWithAiTask',
      {
        stateName: 'GenerateWithAiTask',
        lambdaFunction: props.generateWithAiFunction,
        outputPath: '$.Payload',
        retryOnServiceExceptions: true,
        // 재시도 정책 설정 (지수 백오프)
      }
    );
    generateWithAiTask.addRetry({
      maxAttempts: 3,
      interval: Duration.seconds(2),
      backoffRate: 2,
      errors: ['ServiceException', 'TimeoutError', 'ThrottlingException'],
    });

    const saveTask = new tasks.LambdaInvoke(this, 'SaveResultTask', {
      stateName: 'SaveResultTask',
      lambdaFunction: props.saveFunction,
      outputPath: '$.Payload',
    });

    // 워크플로우 정의
    const definition = checkTask.next(
      new sfn.Choice(this, 'IsAlreadyProcessed')
        // 이미 처리된 경우
        .when(
          sfn.Condition.booleanEquals('$.isProcessed', true),
          new sfn.Succeed(this, 'AlreadyProcessed')
        )
        // 처리되지 않은 경우
        .otherwise(
          fetchTask.next(
            generateWithAiTask.next(
              saveTask.next(new sfn.Succeed(this, 'ProcessingComplete'))
            )
          )
        )
    );

    // State Machine 생성
    this.stateMachine = new sfn.StateMachine(
      this,
      'WeeklySummaryStateMachine',
      {
        definition,
        timeout: Duration.minutes(5),
        tracingEnabled: true,
      }
    );

    this.triggerLambda = new NodejsFunction(this, 'TriggerLambda', {
      entry: 'amplify/functions/summary-weekly-reflection/trigger/index.ts',
      handler: 'handler',
      environment: {
        STATE_MACHINE_ARN: this.stateMachine.stateMachineArn,
      },
    });

    this.stateMachine.grantStartExecution(this.triggerLambda);
  }
}
