![Hackathon Logo](docs/images/hackathon.png?raw=true "Hackathon Logo")

# Sitecore Hackathon 2025

## Team name

⟹ Aignite Hub

## Category

⟹ Content Hub Integration , AI

## Description

⟹ In the modern digital ecosystem, ensuring web accessibility and maximizing SEO performance are paramount. Images significantly influence user engagement and SEO ranking. Alternative text (alt text) provides descriptive, textual alternatives to images, making digital content accessible to visually impaired users and improving search engine visibility.

To overcome these challenges, we've developed a React-based application integrated with Sitecore Content Hub, leveraging AI to automatically generate alt text while enabling bulk image uploads seamlessly.

-   Module Purpose
    -   Utilize AI to analyze images, generate alt text, and upload it to Sitecore Content Hub.
-   What problem was solved (if any)
    -   Bulk asset uploads make alt text updates time-consuming and prone to errors.
    -   How does this module solve it
        -   Our AI-powered React application simplifies the alt text generation process by analyzing images during upload and producing precise descriptions. This eliminates the need for manual entry, enhancing productivity and ensuring compliance with accessibility standards.

Documentation Link (https://horizontal-my.sharepoint.com/:b:/p/girish_jain/Ef8Pc3AsFOJGgp96o1myKoUByz1cLnBvG8HqZPi4XGHGDQ?e=TW9mfh)

## Video link

⟹ https://www.youtube.com/watch?v=2zPVs_uPsE8

## Pre-requisites and Dependencies

-   **React.js** – Frontend framework.
-   **React Dropzone** – For handling drag-and-drop file uploads.
-   **Axios** – For API requests.
-   **Tailwind CSS** – For styling.
-   **OpenAI API** – To generate alt text for images.
-   **Sitecore Content Hub API** – To upload images.

## Setup Instructions

1. Clone the repository:

    ```sh
    git clone <repo-url>
    cd <repo-folder>
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

3. Credentials required to Connect with Content hub and OpenAi:

    ```env
    SITECORE_CONTENT_HUB_URL=<your-sitecore-url>
    SITECORE_CONTENT_HUB_API_URL=<your-sitecore-api-url>
    CLIENT_ID=<your-client-id>
    CLIENT_SECRET=<your-client-secret>
    OPENAI_API_KEY=<your-openai-api-key>
    ```

4. Start the development server:

    ```sh
    npm run dev
    ```

## Usage

1. **Upload Images:** Drag and drop or select JPG/PNG images.
2. **AI-Generated Alt Text:** Automatically generates alt text using OpenAI.
3. **Upload to Sitecore Content Hub:** Click "Upload" to save images in Sitecore.
4. **View Progress:** Check real-time progress updates.

## Comments

-   **Do NOT expose API keys in the frontend.** Use a backend service to handle authentication securely.
-   **Ensure API keys are stored in environment variables** (`.env`) and not committed to version control.
