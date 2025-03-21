import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../amplify/data/resource';

Amplify.configure(outputs);

const client = generateClient<Schema>({ authMode: 'apiKey' });

async function listTestSummary() {
  const { data, errors } = await client.models.Summary.list({
    summaryId: 'W#2025#11',
  });
  if (errors) {
    console.error(errors);
    return;
  }
  console.log(data);
}

listTestSummary().catch(console.error);
