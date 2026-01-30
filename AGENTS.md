## Vercel deployment checks
- When checking Vercel deployments and the latest status is Error, always pull the build logs (e.g., `vercel inspect <deployment> --logs`) and share the failure details.
- If logs cannot be fetched, ask the user to confirm running the log command.
