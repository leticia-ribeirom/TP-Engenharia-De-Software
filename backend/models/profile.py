from pydantic import BaseModel

class ChangeEmailRequest(BaseModel):
    new_email: str
    current_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class DeleteAccountRequest(BaseModel):
    password: str