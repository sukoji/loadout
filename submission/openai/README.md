# OpenAI Plugin Directory Submission

Loadout should be submitted as **Skills only**. It does not operate its own remote MCP server; its skills
inspect a project, recommend optional third-party extensions, and prepare host-compatible configuration
only after user selection and confirmation.

## Portal checklist

1. Confirm the OpenAI Platform organization has **Apps Management: Write** permission.
2. Complete individual or business verification for the publisher identity.
3. Run `npm run submission:validate` and `npm run submission:build` from the repository root.
4. Open the OpenAI plugin submission portal, choose **Create plugin → Skills only**, and upload the ZIP
   printed by the build command.
5. Copy the listing fields, starter prompts, release notes, and test cases from `listing.json`.
6. Upload `assets/logo.png`; `assets/logo.svg` is the editable source.
7. Select the verified publisher identity and permitted countries or regions.
8. Test both imported skills in a clean environment, resolve every portal scan result, review policy
   attestations, and submit for review.

## Public URLs

- Website: <https://github.com/sukoji/loadout>
- Support: <https://github.com/sukoji/loadout/issues>
- Privacy: <https://github.com/sukoji/loadout/blob/main/PRIVACY.md>
- Terms: <https://github.com/sukoji/loadout/blob/main/TERMS.md>

The final submit action belongs to the verified publisher. Do not record identity documents, portal session
cookies, reviewer credentials, or private organization information in this repository.
