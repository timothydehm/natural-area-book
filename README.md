# Natural Areas Pattern Book: website

A small static site: an introduction, the two parts, and one page per pattern, with links between them. Visitors can collect patterns into "My book" and print their own copy, one pattern per landscape letter page.

To preview it, double-click `index.html`. It works without a server.

## What's here

| Path | What it is |
|---|---|
| `index.html`, `style.css`, `app.js` | The site |
| `data.js` | The content, generated from the spreadsheet. Don't edit by hand. |
| `content/` | The master spreadsheet (.xlsx). Used when no Google Sheet is connected. |
| `photos/` | Original photos. Put new ones here. |
| `photos/web/` | Smaller copies for the web, generated automatically |
| `tools/update_site.py` | Reads the spreadsheet, writes `data.js`, makes the web photos |
| `.github/workflows/update-site.yml` | The "Update site" button on GitHub |

## Publishing on GitHub (one time)

1. Create a new repository on GitHub and upload everything in this folder, including the `.github` folder.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Go to **Actions → Update site → Run workflow**. A minute later the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Updating the site

The site changes only when you tell it to.

- **From the Google Sheet:** in **Settings → Secrets and variables → Actions → Variables**, add a variable named `SHEET_ID`. Its value is the long ID in the sheet's link, between `/d/` and `/edit`. The sheet must be shared as *Anyone with the link: Viewer*. After that, edit the sheet whenever you like. When you're ready to publish, click **Actions → Update site → Run workflow**.
- **From an Excel file:** replace the .xlsx in `content/`. Uploading it publishes the change automatically.

## Adding photos

Upload the photo to `photos/`, put its exact filename in the **Photo** column, and run **Update site**. To change how a photo is framed, put a crop code like `x40 y60 z1.2` in **Photo crop**:

- `x` and `y` (0 to 100) choose which part of the photo stays in view.
- `z` (1 to 4) zooms in.

**Photo Crop Helper:** open `crop.html` on the published site (`…github.io/natural-area-book/crop.html`), or double-click it in this folder. Pick a pattern, then drag and zoom. It previews the crop on a computer, a wide screen and a phone, warns if the photo will print soft, and gives you the code to copy into **Photo crop**.

## Spreadsheet tabs the site reads

- **Patterns:** one row per pattern. The Notes column is never published.
- **Book:** Title, Kicker, Edition, Intro, How to use, Part 1/2 name, Part 1/2 intro, and Cover photo with its crop. In the long text cells, start a new line for each paragraph, and begin a paragraph with "Therefore:" to style it.
