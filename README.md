# Self Approval App

> A GitHub App built with [Probot](https://github.com/probot/probot) that allows Pull Request authors to self-approve their Pull Requests.

> Special thanks to [dkhmelenko/autoapproval](https://github.com/dkhmelenko/autoapproval) for providing some inspiration and also some code implementation for this App.

## Introduction

For some repositories, the Pull Request have to be approved before it can be merged.

This GitHub App allows some whitelisted repository maintainers to self-approve their Pull Requests, so they can directly approve and merge their own Pull Requests.

## Local Setup / Server Deployment

Install dependencies

```
npm install
```

Build the project

```
npm run build
```

Start the server

```
npm start
```

Follow the instructions to register a new GitHub app.

## Deploy to Vercel

This app can be continuously deployed to [Vercel](https://vercel.com/) using the [Vercel GitHub app](https://github.com/apps/vercel).

### Considerations

- Make sure you configure [the environment variables for your GitHub App](https://probot.github.io/docs/configuration/) in Vercel. You can read more about how to do it in [their docs](https://vercel.com/docs/concepts/projects/environment-variables).
- Vercel [expects to find your lambda functions under `/api` folder]([url](https://vercel.com/docs/concepts/functions/serverless-functions#deploying-serverless-functions)). Make sure your functions are placed there and double check Vercel detected your Lambda Functions during the deployment process by checking the logs:

![image](https://user-images.githubusercontent.com/2574275/187179364-b0019f95-be41-462a-97d5-facf4de39095.png)

### How it works

The [api/github/webhooks/index.ts](api/github/webhooks/index.ts) file is handling requests to `POST /api/github/webhooks`, make sure to configure your GitHub App registration's webhook URL accordingly.

## License

[ISC](LICENSE) © 2022-2023 iXOR Technology & Cubik65536
