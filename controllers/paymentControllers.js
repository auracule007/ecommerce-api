const Cart = require("../models/cart");
const Order = require("../models/order");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const transporter= require("../config/email");

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

exports.initiatePayment = async (req, res) => {
  const { user } = req;
  const { amount, currency, firstName, lastName, email, address, phone } =
    req.body;

  try {
    const cart = await Cart.findOne({ user: user.id });
    if (!cart || cart.products.length === 0) {
      res.json("Cart not found");
    }

    const orderId = uuidv4();
    const paymentData = {
      tx_ref: orderId,
      amount,
      currency,
      redirect_url: 'http://localhost:5173/thankyou',
      // redirect_url: "http://localhost:8000/api/payment/verify",
      customer: {
        email: `${user.email}`,
        name: `${user.firstName} ${user.lastName}`,
        phonenumber: phone,
      },
      meta: {
        firstName,
        lastName,
        email,
        phone,
        address,
      },
      customizations: {
        title: "ShoesByStores Purchase",
        description: "Payment for cart Items",
      },
    };

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (data.status === "success") {
      res.json({ status:data.status, message: data.message,  link: data.data.link, orderId });
    } else {
      res.json("Payment failed");
    }
  } catch (error) {
    console.log({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  const { transaction_id, orderId } = req.body;

  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );
    const data = await response.json();
    console.log(data);
    if (data.status === "success") {
      const cart = await Cart.findOne({ user: req.user.id }).populate(
        "products.product", "user"
      );
      if (!cart || cart.products.length === 0) {
        res.json("Cart not found");
      }
      const order = new Order({
        user: req.user.id,
        orderId,
        firstName: data.data.meta.firstName,
        lastName: data.data.meta.lastName,
        email: data.data.meta.email,
        phone: data.data.meta.phone,
        address: data.data.meta.address,
        products: cart.products,
        status: "complete",
        transactionId: transaction_id,
        amount: data.data.amount,
        quantity: data.data.quantity,
      });
      
      // const mailOptions = {
      //   from: process.env.EMAIL_USER,
      //   to: data.data.meta.email,
      //   subject: `Hello ✔ ${req.user.firstName}`,
      //   text: `Hello ${req.user.firstName}, you have successfully made payments for items in your cart`,
      // };
      
      // try {
      //   await transporter.sendMail(mailOptions);
      //   console.log("Email sent successfully");
      // } catch (error) {
      //   console.error("Error sending email:", error.message);
      //   res.status(500).json({ message: "Failed to send email" });
      // }
      
      await order.save();

      await Cart.findOneAndDelete({ user: req.user.id });
      res.json({ mesasge: "Payment successful", order });


      
    } else {
      res.json({ message: "Payment Failed" });
    }
  } catch (error) {
    console.log({ message: error.message });
  }
};


exports.getUserOrder = async(req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate("products.product", "user")
    if(!orders) return res.status(400).json({ message: "Order not found "})
    res.json(orders);
  }catch (error) {
    console.log({ message: error.message })
  }
}