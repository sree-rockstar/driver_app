from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, drivers, admin, documents, mpin, status, trips, vehicles, trip_types, payment_methods, earnings, money_requests

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(drivers.router, prefix="/drivers", tags=["drivers"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(mpin.router, prefix="/mpin", tags=["mpin"])
api_router.include_router(status.router, prefix="/statuses", tags=["statuses"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
api_router.include_router(trip_types.router, prefix="/trip-types", tags=["trip-types"])
api_router.include_router(payment_methods.router, prefix="/payment-methods", tags=["payment-methods"])
api_router.include_router(earnings.router, prefix="/earnings", tags=["earnings"])
api_router.include_router(money_requests.router, prefix="/money-requests", tags=["money-requests"])


