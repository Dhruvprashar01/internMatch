import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const PublicLayout = ({ children }) => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
    <Navbar />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
);

export default PublicLayout;
