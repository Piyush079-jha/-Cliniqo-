import React from "react";
import Hero from "../components/Hero";
import Biography from "../components/Biography";
import Departments from "../components/Departments";
import Testimonials from "../components/Testimonials";
import CTABanner from "../components/CTABanner";
import MessageForm from "../components/MessageForm";

const Home = () => {
  return (
    <div style={{ paddingTop: "70px" }}>
      <Hero
        title='Your Health,<br/><em>Our Priority</em>'
        description="Cliniqo connects you with India's best doctors. Book appointments, get specialist consultations, and manage your health journey — all from one trusted platform."
      />
      <Biography />
      <Departments />
      <Testimonials />
      <CTABanner />
      <MessageForm />
    </div>
  );
};

export default Home;