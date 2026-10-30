# Put this release in your existing GitHub repository

These instructions assume the Neon Signal project is already connected to GitHub. They do not create a new repository or commit anything automatically.

## 1. Back up your current project

Before replacing files, make a copy of your current project folder. This gives you a working backup of the version that is already deployed.

## 2. Extract and copy the updated source

1. Download `neon-signal-submission-v0.1.0.zip`.
2. Extract the ZIP somewhere easy to find, such as your Desktop.
3. Open the extracted `neon-signal` folder.
4. Open your existing local Git repository folder (the one that contains the hidden `.git` folder and your current `package.json`).
5. Copy the **contents** of the extracted `neon-signal` folder into the root of your existing repository. Allow the updated source files to replace the old ones.
6. Do not delete or replace your repository's hidden `.git` folder.
7. Do not copy `.env.local` or `.dev.vars` from any old working folder. They are private local credentials and are intentionally not in this ZIP.

## 3. Run the project checks

In VS Code, open the existing repository folder, choose **Terminal → New Terminal**, and run:

```bash
node --version
npm ci
npm run check
```

Use Node.js 20 or newer. `npm run check` runs the automated unit tests and then creates the production build. Do not push if either command fails; keep the exact error text so it can be diagnosed.

## 4. Review the files before committing

Run:

```bash
git status --short
git branch --show-current
```

Review the changed-file list. Confirm that no `.env.local`, `.dev.vars`, TURN token, or other private credential is being added. `.env.example` is safe because its values are blank placeholders.

## 5. Commit and push

When the checks pass and the changed-file list looks correct, run:

```bash
git add .
git commit -m "Prepare Neon Signal submission release v0.1.0"
git push origin main
```

If `git branch --show-current` returned `master` or another branch name, replace `main` in the push command with that branch name.

## 6. Confirm the deployment

1. Open your GitHub repository and select **Actions**.
2. Open the newest **Continuous Integration** run. Confirm the Test and build job succeeds.
3. Open Cloudflare Dashboard → **Workers & Pages** → your `neon-signals` Pages project → **Deployments**.
4. Confirm the deployment from your pushed commit succeeds.
5. Re-test `/api/ping`, `/api/turn` (do not share its credential fields), a two-device room, and Watch a Game with a third device.

Your Cloudflare production variables are stored in the Cloudflare dashboard, not in this ZIP. They should remain configured there.
