export function request(ctx) {
  return {
    operation: "PutEvents",
    events: [
      {
        source: "kr.co.daylog.services.dailies",
        ["detail-type"]: "DailySummarized",
        detail: { ...ctx.args },
      },
    ],
  };
}

export function response(ctx) {
  return ctx.args;
}