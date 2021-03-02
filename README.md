# serverless-aws-template

A template repo for how to structure serverless functions powered by aws lambda.

For functions powered by AWS, we typically recommend having a single serverless
app per project with each function having its own folder in `src`, and that code
used in more than one function be placed `src/utils` (should your project have
multiple functions).

Included in this template are some templates for configuring and typing
functions to be invoked by a particular
[event](https://www.serverless.com/framework/docs/providers/aws/events/) - since
most projects only require one or two functions, as part of setting up your repo
from this template, you should pick out the functions that fit the tasks you
want to perform, rename them appropriately, and delete the rest.

You can also copy these functions along with their configurations into existing
projects if you wish.

## Usage

To use this template, clone it locally and then remove the `.git` folder:

```
git clone --depth=1 git@github.com:ackama/serverless-aws-template.git my-project-dir
cd my-project-dir # change into the freshly cloned repos directory
rm -rf .git    # remove the existing git repo
git init       # initalise a new git repo
```

Then you should:

1. Replace all references to the template name (`serverless-aws-template`) with
   the name of the project
1. Remove any lambda templates you don't want to use, and rename the ones you do
1. Remove this section of the readme, between (but not including) the project
   name and "Project Overview" headers
   - The remainder of this readme is written from the perspective of the
     project, meaning
1. Add the AWS credentials as secrets to the repo to allow CI to deploy:
   - `STAGING_AWS_ACCESS_KEY_ID`
   - `STAGING_AWS_SECRET_ACCESS_KEY`
   - `PRODUCTION_AWS_ACCESS_KEY_ID`
   - `PRODUCTION_AWS_SECRET_ACCESS_KEY`

## Project Overview

### Infrastructure

serverless manages everything about the lambdas except the code itself,
including:

- packaging code into a zip file
- deploying to specific stages (via an S3 bucket)
- provisioning infrastructure (e.g, api gateways, sns topics, cloudwatch timers)
- configuring permissions on the iam role used by the lambdas

along with any infrastructure resources needed to support them (e.g, api
gateway, iam roles, s3 buckets).

All of this configuration is stored in `serverless.yml`. You can find details on
all possible values supported by this file
[here](https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml/).

You can find a general introduction to AWS on Serverless
[here](https://www.serverless.com/framework/docs/providers/aws/guide/intro/).

Additional infrastructure is defined in `resources.yml`, which Serverless passes
to CloudFormation to include as part of its Stack.

#### Stages

A "stage" in serverless is equivalent to what we typically refer to as an
"environment" in our apps and infrastructure. Since serverless prefixed
resources with the name of the stage they're for, we tend to favor shorthand
names for some environments (i.e "prod" for "production").

You can target a specific stage when running serverless commands with the
`--stage` option; if omitted, it defaults to the `stage` property of the
`provider` in `serverless.yml`:

```shell
sls package --stage prod

sls deploy --stage staging
sls deploy --stage prod
sls deploy # uses the default stage

sls invoke --stage uat
```

#### Environment variables

You set which environment variables are passed to your functions with the
`environment` property, set at the `provider` level (to pass a variable to all
lambdas), or at the `function` level (to pass a variable to only specific
functions).

Note that these two properties are merged when being applied to each function,
rather than acting as an override.

If an environment variable is not found, Serverless will print a warning but
_continue_ - this is important as it means CI won't fail when deploying if
environment variables are missing.

Serverless supports reading `.env` and `.env.{stage}` files which can be useful
when invoking functions locally; alternatively `direnv` can be used to set env
variables.

Details on how Serverless resolves environment variables can be found
[here](https://www.serverless.com/framework/docs/environment-variables/).

#### `IAM` policy statements

By default, the IAM role used by the lambdas only has basic permissions required
to be deployed and invoked.

You can add more permissions to the default role using the `iamRoleStatements`
provider property. For example:

```yaml
provider:
  iamRoleStatements:
    - Effect: 'Allow'
      Action:
        - 'organizations:DescribeAccount'
      Resource: '*'
```

You can also create custom IAM roles for each function, detailed
[here](https://www.serverless.com/framework/docs/providers/aws/guide/iam/).

### Typechecking

This project is powered by TypeScript, with the types for the event handlers
provided by `@types/aws-lambda`.

You can type-check your project using the `typecheck` script:

    npm run typecheck

Compiling is done using the `build` command:

    npm run build

This command is run by serverless (via `serverless-plugin-scripts`) before
packaging or deploying due to custom configuration that can be found in the
`serverless.yml` file.

This plugin dependency and its configuration can be removed if deployments are
done via CI, which ideally should be the case for all projects.

### Linting

Linting is powered by `eslint` with `prettier` and our standard eslint config
sourced from `eslint-config-ackam`.

You can perform linting on your project using the `lint` script:

    npm run lint

You can have `eslint` apply fixes where possible by passing `--fix`:

    npm run lint -- --fix

You can run `prettier` on files not checked by `eslint` (such as `md` and `yml`
files) using the `format` script:

    npm run format

You can have `prettier` just report if any files need formatting by passing
`--check`:

    npm run format --check

This can be useful for CI, to ensure docs & `serverless.yml` remain well
formatted.

### Testing

Testing is powered by `jest` and can run with the `test` script:

    npm run test # or just npm test

You can get coverage information by passing `--coverage`:

    npm run test -- --coverage

Testing related code lives in the `test` directory, with the specs for specific
files living in `test/src`. Ideally this folder should mirror `src` to make it
easy to look up tests for particular files.

Other code-related tests, like setup scripts, fixtures, and functions for
building common objects, should live within the `test` directory outside of
`test/src`.

### Deploying

Deployments are done using the serverless cli, like so:

    sls deploy --stage <stage>

This will trigger packaging up the code, uploading the resulting zip to an S3
bucket, and then deploying that zip to an aws lambda based on the targeted
`stage`.

Any changes that need to be made to the infrastructure will also be applied as
part of the deployment process as well.

Deployments are done automatically via CI whenever new commits are pushed to
specific branches depending on the stage (`main` for `staging` and `production`
for `prod`).
