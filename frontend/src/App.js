import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";

import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";

import Home from "./pages/Home";
import Apps from "./pages/Apps";
import AppDetail from "./pages/AppDetail";
import Instruments from "./pages/Instruments";
import Shop from "./pages/Shop";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Legal from "./pages/Legal";
import { PaymentSuccess, PaymentCancel } from "./pages/Payment";

function App() {
  return (
    <div className="App bg-slate-950 text-slate-100 min-h-screen">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Navbar />
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/apps/:id" element={<AppDetail />} />
              <Route path="/instruments" element={<Instruments />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login mode="login" />} />
              <Route path="/register" element={<Login mode="register" />} />
              <Route path="/account" element={<Account />} />
              <Route path="/privacy" element={<Legal kind="privacy" />} />
              <Route path="/terms" element={<Legal kind="terms" />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
            </Routes>
            <Footer />
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#141722",
                  border: "1px solid #23283B",
                  color: "#F1F5F9",
                },
              }}
            />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
