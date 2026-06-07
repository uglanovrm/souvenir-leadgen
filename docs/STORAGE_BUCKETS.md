# Storage Buckets

Storage is owned by Supabase Storage. The frontend must use authenticated user flows and must not receive the service role key.

| Bucket | Public | Purpose | Path convention |
| --- | --- | --- | --- |
| `portfolio-assets` | yes | Approved portfolio examples for offers | `packages/{package_id}/{asset_id}.{ext}` |
| `company-logos` | no | Uploaded and prepared company logos | `organizations/{organization_id}/{brand_asset_id}/original.{ext}` |
| `mockup-sources` | no | PSD/source files, not runtime renderer input | `sources/{source_id}/source.psd` |
| `mockup-templates` | no | Runtime mockup packs | `templates/{template_id}/base.png`, `mask.png`, `shadow.png`, `highlight.png`, `template.json` |
| `generated-mockups` | no | Watermarked preview renders | `offers/{offer_id}/renders/{render_id}.png` |
| `offer-exports` | no | Prepared offer exports | `offers/{offer_id}/exports/{export_id}.pdf` |
| `imports` | no | CSV/import source files | `campaigns/{campaign_id}/imports/{import_id}.csv` |

Generated mockups and offer exports are not sendable until matching database rows pass QA and human approval.
