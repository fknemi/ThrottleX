// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    // Verify the payment signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is successful, update your database here

      return NextResponse.json({
        success: true,
        message: "Payment has been verified successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
