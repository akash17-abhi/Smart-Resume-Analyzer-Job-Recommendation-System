from flask import Flask, render_template, request, jsonify
import PyPDF2
import re
import logging
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration for file uploads
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'pdf'}

# Setup logging for debugging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_pdf_text(pdf_file):
    """Extract text from PDF file with error handling."""
    try:
        # Reset file pointer to beginning
        pdf_file.seek(0)
        logger.debug(f"Reading PDF file: {pdf_file.filename}")
        
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        if len(pdf_reader.pages) == 0:
            logger.warning("PDF file has no pages")
            return None
        
        resume_text = ""
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                text = page.extract_text()
                if text:
                    resume_text += text
                logger.debug(f"Extracted text from page {page_num + 1}")
            except Exception as e:
                logger.warning(f"Error extracting text from page {page_num + 1}: {str(e)}")
                continue
        
        if not resume_text.strip():
            logger.warning("No text could be extracted from PDF")
            return None
        
        logger.debug(f"Successfully extracted {len(resume_text)} characters from PDF")
        return resume_text
    
    except PyPDF2.PdfReadError as e:
        logger.error(f"Invalid PDF file: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error reading PDF: {str(e)}")
        return None

def clean_text(text):
    """Convert text to lowercase and extract unique words."""
    if not text:
        return set()
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters, keep only alphanumeric and spaces
    text = re.sub(r'[^a-z0-9 ]', '', text)
    
    # Split into words and remove empty strings
    words = [word for word in text.split() if word]
    
    logger.debug(f"Cleaned text contains {len(set(words))} unique words")
    return set(words)

@app.route("/")
def home():
    """Render the home page."""
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    """Analyze resume against job description and return match percentage."""
    try:
        logger.info("Starting resume analysis...")
        
        # Check if resume file is present
        if 'resume' not in request.files:
            logger.error("No resume file provided")
            return jsonify({"error": "No resume file provided"}), 400
        
        resume_file = request.files['resume']
        
        # Check if file was actually selected
        if resume_file.filename == '':
            logger.error("Resume file not selected")
            return jsonify({"error": "Resume file not selected"}), 400
        
        # Validate file extension
        if not allowed_file(resume_file.filename):
            logger.error(f"Invalid file type: {resume_file.filename}")
            return jsonify({"error": "Only PDF files are allowed"}), 400
        
        # Extract text from PDF
        resume_text = extract_pdf_text(resume_file)
        if resume_text is None:
            logger.error("Failed to extract text from PDF")
            return jsonify({"error": "Failed to extract text from PDF. Ensure the file is a valid PDF."}), 400
        
        # Get job description
        job_description = request.form.get('job_desc', '').strip()
        if not job_description:
            logger.error("No job description provided")
            return jsonify({"error": "Job description is required"}), 400
        
        logger.debug(f"Job description length: {len(job_description)} characters")
        
        # Clean and extract keywords from both texts
        resume_words = clean_text(resume_text)
        job_words = clean_text(job_description)
        
        logger.debug(f"Resume words: {len(resume_words)}, Job words: {len(job_words)}")
        
        # Find matching keywords
        matched_words = resume_words.intersection(job_words)
        
        # Calculate match percentage
        if len(job_words) == 0:
            match_percentage = 0
            logger.warning("Job description has no valid words after cleaning")
        else:
            match_percentage = (len(matched_words) / len(job_words)) * 100
        
        logger.info(f"Analysis complete. Match: {round(match_percentage, 2)}%")
        logger.debug(f"Matched words: {matched_words}")
        
        # Return results as JSON
        return jsonify({
            "success": True,
            "match_percentage": round(match_percentage, 2),
            "matched_keywords": list(matched_words),
            "total_job_keywords": len(job_words),
            "total_matched": len(matched_words)
        }), 200
    
    except Exception as e:
        logger.error(f"Unexpected error in analyze route: {str(e)}", exc_info=True)
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
