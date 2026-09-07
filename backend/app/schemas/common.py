from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """One entry of the standard error envelope (frontend-spec.md §15.2)."""

    code: str
    message: str


class ErrorResponse(BaseModel):
    """Error envelope every 4xx/5xx response uses: { "error": { "code", "message" } }."""

    error: ErrorDetail
