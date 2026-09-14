import re

def clean_text(text: str) -> str:
    """
    Cleans and normalizes extracted text:
    - Normalizes carriage returns and multiple newlines
    - Strips non-printable control characters
    - Normalizes irregular whitespace while preserving paragraph flow
    """
    if not text:
        return ""

    # Replace windows line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove control characters except standard whitespace
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # Collapse excessive line breaks (more than 2 -> 2)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Collapse excessive spaces / tabs
    text = re.sub(r'[ \t]{2,}', ' ', text)

    return text.strip()
