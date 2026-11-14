# Deploying the playground

The playground is a static website. `vercel.json` builds it and publishes only the standalone HTML and two browser distributions in `.local/site`; no framework conversion or environment variables are needed.

## Vercel

1. Open [New Project](https://vercel.com/new), choose your account or team, and import `dhruvil-codes/koi-pond` from GitHub.
2. Use the repository root (`./`) and Framework Preset **Other**. The committed configuration sets:

   | Setting | Value |
   | --- | --- |
   | Install command | `npm ci` |
   | Build command | `npm run build && node scripts/prepare-site.mjs` |
   | Output directory | `.local/site` |

3. Deploy and check the generated `vercel.app` URL before moving the custom domain.
4. In the Vercel project, open **Settings → Domains**, add `koi-pond.bydhruvil.in`, and copy the CNAME target shown for that project. Vercel uses project-specific targets; copy the displayed value rather than a generic example. Complete any ownership verification Vercel requests.
5. In Hostinger's DNS editor, edit the existing record:

   | Field | Value |
   | --- | --- |
   | Type | `CNAME` |
   | Name | `koi-pond` |
   | Target | The exact target shown by Vercel |
   | TTL | `14400`, or the provider's supported default |

   Replace `dhruvil-codes.github.io` in that record. Keep the portfolio's apex records and nameservers as they are.
6. Wait for Vercel to show **Valid Configuration** and provision HTTPS. DNS caches can delay the switch; the `vercel.app` deployment remains usable meanwhile.
7. Once the custom Vercel domain works over HTTPS, remove its old association in the repository's GitHub Pages settings if you no longer want Pages to manage that hostname. GitHub Pages and its workflow can remain available as a separate deployment, or be disabled deliberately afterward.

With a Git-connected Vercel project, future pushes to its production branch deploy automatically.

Official references: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json) and [custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## Local build check

```sh
npm ci
npm run build
node scripts/prepare-site.mjs
```

The site output contains `index.html`, `dist/koi-pond.js` and `dist/koi-pond.iife.js`. Local archives, reference files and worktrees are excluded from CLI uploads and from the site output.
