from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io, uuid, os
from datetime import datetime

app = FastAPI()
origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/send_message")
async def send_message(file: UploadFile = File(...)):
    # Read the content of the uploaded file
    content = await file.read()

    # Generate a unique filename using timestamp and UUID
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())
    filename = f"audio_{timestamp}_{unique_id}.webm"

    # Save the file to a directory (e.g., "uploads")
    save_directory = "/app/uploads"
    os.makedirs(save_directory, exist_ok=True)  # Create the directory if it doesn't exist
    file_path = os.path.join(save_directory, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Prepare the audio for streaming back
    audio_stream = io.BytesIO(content)
    response = StreamingResponse(audio_stream, media_type='audio/webm')
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    return response
