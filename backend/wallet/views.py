from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from .serializers import WithdrawalAccountSerializer
from .models import WithdrawalAccount
from transactions.models import Deposit, Withdrawal
from transactions.serializers import DepositSerializer, WithdrawalSerializer
from rest_framework.parsers import MultiPartParser, FormParser


@method_decorator(ensure_csrf_cookie, name='dispatch')
class DepositRequestView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        # Handle the multipart form data
        amount = request.data.get('amount')
        method = request.data.get('method')
        proof_image = request.FILES.get('proof_image')
        
        # Validate required fields
        if not amount:
            return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not method:
            return Response({"error": "Payment method is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not proof_image:
            return Response({"error": "Proof of payment is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'application/pdf']
        if hasattr(proof_image, 'content_type') and proof_image.content_type not in allowed_types:
            return Response(
                {"error": "Invalid file type. Only JPG, PNG and PDF are allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create deposit with the file
        serializer = DepositSerializer(data={
            'amount': amount,
            'method': method,
            'proof_image': proof_image
        })

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConfirmDepositView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request, pk):
        try:
            deposit = Deposit.objects.get(pk=pk, user=request.user)
        except Deposit.DoesNotExist:
            return Response({"message": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        # Only allow attaching proof; admin will change status via admin
        serializer = DepositSerializer(deposit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WithdrawalRequestView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        data = request.data.copy()
        serializer = WithdrawalSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WithdrawalAccountListCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        accounts = WithdrawalAccount.objects.filter(user=request.user)
        serializer = WithdrawalAccountSerializer(accounts, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        serializer = WithdrawalAccountSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WithdrawalAccountDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def put(self, request, pk):
        try:
            account = WithdrawalAccount.objects.get(pk=pk, user=request.user)
        except WithdrawalAccount.DoesNotExist:
            return Response({"message": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = WithdrawalAccountSerializer(account, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)