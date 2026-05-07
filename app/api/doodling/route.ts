import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        "CRITICAL: GEMINI_API_KEY is missing from environment variables.",
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    console.log("Received image for conversion:", apiKey);

    // Initialize the new Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Convert the uploaded File into a Base64 string for the SDK
    const imageBytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    const promptText = `Convert this photo into a hand-drawn doodle / sketch style illustration. 
      Make it look like it was drawn with a black pen or pencil on white paper. 
      Use clean line art, simple strokes, minimal shading with cross-hatching where needed.
      Keep the composition recognizable but give it a whimsical, sketchy, hand-drawn character.
      Output: white background with black ink lines only, like a coloring book page or technical sketch.`;

    // Format the prompt array exactly as the SDK expects for image-to-image
    const promptContents = [
      { text: promptText },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
    ];

    // Call the model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: promptContents,
    });

    // Check if we got a valid response
    if (!response.candidates || response.candidates.length === 0) {
      return NextResponse.json(
        { error: "No response generated." },
        { status: 500 },
      );
    }

    const parts = response.candidates[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "Response was empty." },
        { status: 500 },
      );
    }

    // Loop through the response parts to find the generated image data
    for (const part of parts) {
      if (part.inlineData) {
        // We found the image! Return it to the frontend.
        return NextResponse.json({
          success: true,
          image: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png", // fallback to png if not specified
        });
      }

      // If the model returned a text error instead of an image (e.g., safety block)
      if (part.text && !parts.some((p) => p.inlineData)) {
        return NextResponse.json(
          {
            error: "The AI returned a text message instead of an image.",
            details: part.text,
          },
          { status: 422 },
        );
      }
    }

    return NextResponse.json(
      { error: "No image found in the AI response." },
      { status: 500 },
    );
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
