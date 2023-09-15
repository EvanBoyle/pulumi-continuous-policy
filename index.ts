import * as pulumi from "@pulumi/pulumi";
import { PolicyPack, StackValidationArgs, ReportViolation } from "@pulumi/policy";

export interface ContinuousPolicyAssertion {
    operator: "eq" | "gt" | "lt" | "lte" | "gte",
    value: number,
}

export interface ContinuousPolicyConfig {
    label: string;
    query: string;
    assertion: ContinuousPolicyAssertion;
}

export interface ContinuousPolicyConfigArgs {
    policies: ContinuousPolicyConfig[];
}

new PolicyPack("continuous-policy", {
    policies: [{
        name: "continuous-policy",
        description: "Continuous global policies that can be configured dynamically across the entire org using Pulumi Resource Search.",
        enforcementLevel: "mandatory",
        configSchema: {
            properties: {
                policies: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            label: {
                                type: "string"
                            },
                            query: {
                                type: "string"
                            },
                            assertion: {
                                type: "object",
                                properties: {
                                    operator: {
                                        type: "string",
                                        enum: ["eq", "gt", "lt", "lte", "gte"]
                                    },
                                    value: {
                                        type: "number",
                                    }
                                }
                            }
                        }
                    },
                },
            }
        },
        validateStack: async (args: StackValidationArgs, reportViolation: ReportViolation) => {
            const config = args.getConfig<ContinuousPolicyConfigArgs>();


            if (!process.env.PULUMI_ACCESS_TOKEN) {
                reportViolation("policy requires PULUMI_ACCESS_TOKEN env var")
            }

            const headers = {
                Accept: "application/json",
                Authorization: `token ${process.env.PULUMI_ACCESS_TOKEN}`,
            };

            for (let p of config?.policies) {
                const query = encodeURIComponent(p.query);
                const body = await fetch(`https://api.pulumi.com/api/orgs/${pulumi.getOrganization()}/search/resources?query=${query}`, {
                    method: "GET",
                    headers: headers,
                })
                const data = await body.json()
                const resultCount = data.total;

                switch (p.assertion.operator) {
                    case "eq":
                        if (resultCount != p.assertion.value) {
                            reportViolation(`${p.label} failed\nexpected query to return ${p.assertion.value} results but got: ${resultCount}`);
                        }
                        break;
                    case "gt":
                        if (resultCount <= p.assertion.value) {
                            reportViolation(`${p.label} failed\nexpected query to return more than ${p.assertion.value} results but got: ${resultCount}`);
                        }
                        break;
                    case "gte":
                        if (resultCount < p.assertion.value) {
                            reportViolation(`${p.label} failed\nexpected query to return ${p.assertion.value} or more results but got: ${resultCount}`);
                        }
                        break;
                    case "lt":
                        if (resultCount >= p.assertion.value) {
                            reportViolation(`${p.label} failed\nexpected query to return less than ${p.assertion.value} results but got: ${resultCount}`);
                        }
                        break;
                    case "lte":
                        if (resultCount > p.assertion.value) {
                            reportViolation(`${p.label} failed\nexpected query to return ${p.assertion.value} or fewer results but got: ${resultCount}`);
                        }
                        break;
                    default:
                        throw new Error(`unexpected operator ${p.assertion.operator}`)
                }
            }
        },
    }],
});
