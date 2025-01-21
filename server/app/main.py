import logging
from fastapi import FastAPI, Request, Response
from app.routes import claims

app = FastAPI()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Maximum size for logging headers and body (in bytes)
MAX_LOG_SIZE = 10024  # Adjust as necessary


@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Log the size of headers
    headers_size = sum(len(k) + len(v) for k, v in request.headers.items())
    logger.info(f"Headers size: {headers_size} bytes")

    # Log headers, truncating if too large
    headers_log = dict(request.headers)
    if headers_size > MAX_LOG_SIZE:
        logger.info(f"Headers: {dict(list(headers_log.items())[:10])}... [Truncated due to size]")
    else:
        logger.info(f"Headers: {headers_log}")

    logger.info(f"Request: {request.method} {request.url}")

    if request.method in ["POST", "PUT", "PATCH"]:
        body = await request.body()
        body_size = len(body)
        logger.info(f"Body size: {body_size} bytes")
        if body_size <= MAX_LOG_SIZE:
            logger.info(f"Body: {body.decode('utf-8')}")
        else:
            logger.info("Body: [Too large to log]")

    response = await call_next(request)

    logger.info(f"Response status: {response.status_code}")
    return response


# Exception handler for logging unhandled exceptions
@app.exception_handler(Exception)
async def log_exceptions(request: Request, exc: Exception):
    logger.error(f"Exception for request {request.method} {request.url}: {str(exc)}", exc_info=True)
    return Response("Internal server error", status_code=500)


# Include routes
app.include_router(claims.router)