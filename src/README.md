# AI-Powered Image Analysis & Upload

This project allows users to upload images, generate AI-powered alt text, and seamlessly upload them to Sitecore Content Hub.

## Features

-   **Drag & Drop Upload:** Supports JPG and PNG images up to 5MB.
-   **AI-Generated Alt Text:** Uses OpenAI to generate descriptive alt text for uploaded images.
-   **Sitecore Content Hub Integration:** Uploads images directly to Sitecore Content Hub.
-   **Progress Tracking:** Displays real-time upload progress.

## Technologies Used

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

## Security Notice

-   **Do NOT expose API keys in the frontend.** Use a backend service to handle authentication securely.
-   **Ensure API keys are stored in environment variables** (`.env`) and not committed to version control.

## License

This project is for educational purposes. Ensure you comply with Sitecore Content Hub and OpenAI usage policies.
