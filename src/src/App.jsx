import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { TbCloudUpload } from "react-icons/tb";
import { FiX } from "react-icons/fi";
import axios from "axios";

// Import CSS
import "./App.css";

// Replace these with  actual values
const SITECORE_CONTENT_HUB_URL = "SITECORE_CONTENT_HUB_URL";
const SITECORE_CONTENT_HUB_API_URL = "SITECORE_CONTENT_HUB_URL/api";
const CLIENT_ID = "CLIENT_ID";
const CLIENT_SECRET = "CLIENT_SECRET";
const OPENAI_API_KEY = "OPENAI_API_KEY";

function App() {
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    // idle, uploading, success, error
    const [uploadStatus, setUploadStatus] = useState("idle");
    // Store error messages
    const [error, setError] = useState("");

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            setError("Only JPG and PNG files are allowed.");
        } else {
            // Clear error if valid files are added
            setError("");
        }
        const newFiles = acceptedFiles.map((file) => ({
            file,
            // Generate preview URL for images
            preview: URL.createObjectURL(file),
        }));
        // Append new files
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        setUploadProgress(0);
        // Reset upload state when new files are selected
        setUploadStatus("idle");
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
        },
        maxSize: 5242880,
        multiple: true,
    });

    const removeFile = (fileName) => {
        const updatedFiles = files.filter(({ file }) => file.name !== fileName);
        setFiles(updatedFiles);

        if (updatedFiles.length === 0) {
            setUploadProgress(0);
            setUploadStatus("idle");
        }
    };

    const resetUpload = () => {
        setFiles([]);
        setUploadProgress(0);
        setUploadStatus("idle");
        setError("");
    };

    const getAccessToken = async () => {
        try {
            const response = await axios.post(
                `${SITECORE_CONTENT_HUB_URL}/oauth/token`,
                `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );
            return response.data.access_token;
        } catch (error) {
            console.error("Error fetching token:", error);
            throw new Error("Failed to get access token");
        }
    };

    // Get OpenAI-generated alt text
    const toBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };
    const generateAltText = async (image) => {
        try {
            const base64Image = await toBase64(image);
            const cleanedBase64 = base64Image.split(",")[1];

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-4-turbo",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Generate a concise alt text (max 150 characters) for the given image based on its content.",
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "Describe this image in less than 150 characters.",
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/png;base64,${cleanedBase64}`,
                                    },
                                },
                            ],
                        },
                    ],
                    max_tokens: 50,
                },
                {
                    headers: {
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.error(
                "Error generating alt text:",
                error.response?.data || error.message
            );
            return "Default alt text";
        }
    };

    const uploadFile = async (file, accessToken) => {
        try {
            // Step 1: Request an upload URL
            const uploadConfig = {
                file_name: file.file.name,
                file_size: file.file.size,
                action: { name: "NewAsset" },
                upload_configuration: { name: "AssetUploadConfiguration" },
            };

            const uploadUrlResponse = await axios.post(
                `${SITECORE_CONTENT_HUB_API_URL}/v2.0/upload`,
                uploadConfig,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const { upload_identifier, file_identifier } =
                uploadUrlResponse.data;
            const uploadUrl = uploadUrlResponse.headers.location;

            // Step 2: Upload the file
            const formData = new FormData();
            formData.append("file", file.file);
            await axios.post(uploadUrl, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            // Step 3: Finalize the upload
            const uploadFinalize = await axios.post(
                `${SITECORE_CONTENT_HUB_API_URL}/v2.0/upload/finalize`,
                { upload_identifier, file_identifier },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Step 4: Update Alt Text
            const altText = await generateAltText(file.file);

            const updateImageMetadata = async (assetId, altText, token) => {
                const url = `${SITECORE_CONTENT_HUB_API_URL}/entities/${assetId}`;

                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                };

                const data = {
                    Properties: {
                        HAltText: altText,
                    },
                    entitydefinition: {
                        href: `${SITECORE_CONTENT_HUB_API_URL}/entitydefinitions/M.Asset`,
                        title: "The entity definition for this entity",
                    },
                };

                try {
                    const response = await axios.put(url, data, { headers });
                    console.log(
                        "Metadata updated successfully:",
                        response.data
                    );
                    return response.data;
                } catch (error) {
                    console.error(
                        "Error updating metadata:",
                        error.response ? error.response.data : error.message
                    );
                    throw error;
                }
            };
            updateImageMetadata(
                uploadFinalize.data.asset_id,
                altText,
                accessToken
            );

            console.log("Uploaded asset ID:", uploadFinalize.data.asset_id);
        } catch (error) {
            console.error("Upload failed for file:", file.name, error);
            throw error;
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploadStatus("uploading");

        try {
            for (let progress = 0; progress <= 100; progress += 10) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                setUploadProgress(progress);
            }

            const accessToken = await getAccessToken();
            await Promise.all(
                files.map((file) => uploadFile(file, accessToken))
            );
            setUploadStatus("success"); // Upload completed
        } catch (error) {
            setUploadStatus("error");
            console.error("Upload failed:", error);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            src={`src/assets/AIHub-sitecore-hackathon-2025.jpg`}
                            alt="Logo"
                            className="h-20 w-20 rounded"
                        />
                        <span className="ml-8 text-xl font-semibold text-gray-800">
                            A-IGNITE HUB
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-2xl w-full space-y-8">
                    <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
                        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                            AI-Powered <br></br> Image Analysis & Upload
                        </h2>
                        <p className="text-center text-sm text-gray-600 mb-6">
                            Upload an image, let AI generate an accurate alt
                            text, and seamlessly upload it to Sitecore Content
                            Hub.
                        </p>

                        <div className="space-y-6">
                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                    isDragActive
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-gray-300 hover:border-gray-400"
                                }`}
                            >
                                <input {...getInputProps()} />
                                <TbCloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">
                                    Drag & drop JPG/PNG files here, or click to
                                    select files
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Max size: 5MB
                                </p>
                            </div>
                            {/* Error Message */}
                            {error && (
                                <p className="text-red-500 text-sm text-center">
                                    {error}
                                </p>
                            )}

                            {/* Selected Files List */}
                            {files.length > 0 && (
                                <div className="space-y-4">
                                    {files.map(({ file, preview }) => (
                                        <div
                                            key={file.name}
                                            className="flex items-center justify-between bg-gray-50 p-4 rounded-lg gap-2"
                                        >
                                            <div className="flex items-center space-x-3">
                                                {/* Preview Image */}
                                                <img
                                                    src={preview}
                                                    alt={file.name}
                                                    className="h-12 w-12 object-cover rounded-md"
                                                />
                                                <span className="text-sm text-gray-700 truncate">
                                                    {file.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <span className="text-sm text-gray-500">
                                                    {(
                                                        file.size /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{" "}
                                                    MB
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        removeFile(file.name)
                                                    }
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FiX className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Single Progress Bar */}
                                    {uploadStatus !== "idle" && (
                                        <div className="relative pt-1">
                                            <div className="flex mb-2 items-center justify-between">
                                                <div>
                                                    {uploadStatus ===
                                                        "uploading" && (
                                                        <span className="text-sm font-semibold text-blue-600">
                                                            Uploading...
                                                        </span>
                                                    )}
                                                    {uploadStatus ===
                                                        "success" && (
                                                        <span className="text-sm font-semibold text-green-600">
                                                            Upload Complete!
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold">
                                                    {uploadProgress}%
                                                </span>
                                            </div>
                                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                                <div
                                                    style={{
                                                        width: `${uploadProgress}%`,
                                                    }}
                                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                                                        uploadStatus ===
                                                        "success"
                                                            ? "bg-green-500"
                                                            : "bg-blue-500"
                                                    }`}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload & Clear Buttons */}
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={handleUpload}
                                            disabled={
                                                files.length === 0 ||
                                                uploadStatus === "uploading" ||
                                                uploadStatus === "success"
                                            }
                                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white transition-all ${
                                                files.length === 0 ||
                                                uploadStatus === "uploading" ||
                                                uploadStatus === "success"
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                        >
                                            Upload
                                        </button>

                                        {/* Clear Button */}
                                        <button
                                            onClick={resetUpload}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <FiX className="-ml-1 mr-2 h-5 w-5" />
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} A-IGNITE HUB. All rights
                        reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
