# Payment QR Page Setup

## What Was Added

A new payment checkout page at `/pay/checkout` that displays a QR code for UPI payments.

## Flow

1. User selects a plan on `/pay` page (Basic or Premium)
2. Clicks "Unlock Basic/Premium Report" button
3. Redirected to `/pay/checkout?report_id=XXX&plan=basic/premium`
4. QR code is displayed with order summary

## Features

- **Dynamic QR Code**: Generated based on selected plan and price
- **UPI Integration**: Scan with any UPI app (GPay, PhonePe, Paytm)
- **Copy UPI ID**: Quick copy button for manual payment
- **Download QR**: Download QR code as PNG
- **Order Summary**: Shows selected plan, features, and total
- **Consistent UI**: Matches the existing dark theme and design system

## Configuration Required

⚠️ **Important:** Update the UPI ID in the checkout page

### File: `src/app/pay/checkout/page.tsx`

Line 56, replace with your actual UPI ID:
```typescript
const upiId = 'yourname@upi'; // Replace with your actual UPI ID
```

Example:
```typescript
const upiId = 'business@paytm';
// or
const upiId = '9876543210@ybl';
```

## Testing

1. Start dev server: `npm run dev`
2. Navigate to `/pay?report_id=test123`
3. Click on any plan button
4. Verify QR code displays correctly
5. Test copy UPI ID button
6. Test download QR code button

## UPI Payment String Format

The QR code contains:
```
upi://pay?pa=<UPI_ID>&pn=UX Analyzer&am=<AMOUNT>&cu=INR&tn=Payment for <PLAN_NAME> - Report <REPORT_ID>
```

## Pricing

- **Basic**: ₹999
- **Premium**: ₹4,999

## Next Steps

1. Update UPI ID in the code
2. Set up payment verification webhook/API
3. Implement auto-unlock after successful payment
4. Add payment status tracking page (optional)
