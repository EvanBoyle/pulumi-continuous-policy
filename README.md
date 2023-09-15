# Pulumi Continuous Policy

Pulumi policies are designed to run at update time on a per-resource or per-stack level. There is no way to continuously run policies over you entire organization until now! 

Continuous Policy allows you to author assertions over [Resource Search](https://www.pulumi.com/docs/pulumi-cloud/insights/search/) and [Property Search](https://www.pulumi.com/docs/pulumi-cloud/insights/search/#property-queries) query results to validate the state of your entire cloud account. These policies evaluate in milliseconds, and can be run continuously, whether that be every minute/hour/day/etc. Ensure that your infrastructure:

- Has no AWS Lambdas depending on the EOL `nodejs12` runtime
- Has no GPU instances created more than 72 hours ago (prevent leaked resources)
- Has at least one cloudwatch alarm
- All databases are MySQL 5.8+

## Configuration and Running

Clone this repo and see [documentation on running local policy packs and specifying configuration](https://www.pulumi.com/docs/using-pulumi/crossguard/configuration/#running-policy-packs-locally). 

You'll need to specify the `continuous-policy` config:

```json
{
    "continuous-policy": {
        "policies": [
            {
                "label": "No node12 labdas",
                "query": ".runtime:nodejs12",
                "assertion": {
                    "operator": "eq",
                    "value": 0
                }
            }
        ]
    }
}
```

The following operators are supported: `"eq", "gt", "lt", "lte", "gte"`

```console
pulumi preview --policy-pack <path-to-policy-pack-directory> --policy-pack-config <path-to-policy-pack-config-file>
```
## Example
```console
$ continuous-policy pulumi preview --policy-pack /Users/evanboyle/garbage/pulumi-continuous-policy --policy-pack-config continuous-policy.json
Previewing update (global)

View in Browser (Ctrl+O): https://app.pulumi.com/pulumi/continuous-policy/global/previews/4fa63be2-408e-4f6d-a5da-8be81cf208d1

     Type                 Name                      Plan       Info
 +   pulumi:pulumi:Stack  continuous-policy-global  create     1 error; 2 warnings


Diagnostics:
  pulumi:pulumi:Stack (continuous-policy-global):
    warning: using pulumi-analyzer-policy from $PATH at /Users/evanboyle/.pulumi/bin/pulumi-analyzer-policy
    warning: using pulumi-analyzer-policy from $PATH at /Users/evanboyle/.pulumi/bin/pulumi-analyzer-policy
    error: preview failed

Policy Violations:
    [mandatory]  continuous-policy v0.0.1  continuous-policy (pulumi:pulumi:Stack: continuous-policy-global)
    Continuous global policies that can be configured dynamically across the entire org using Pulumi Resource Search.
    No node12 labdas failed
    expected query to return 0 results but got: 148
```