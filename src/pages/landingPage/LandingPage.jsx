import Navbar from "../../../src/components/ui/Navbar";
import HeroSection from "../../../src/components/ui/HeroSection";
import ProblemStatement from "../../../src/components/ui/ProblemStatement";
import Solution from "../../../src/components/ui/Solution";
import Features from "../../../src/components/ui/Features";
import Usecase from "../../../src/components/ui/Usecase";
import Supervisor from "../../../src/components/ui/Supervisor";
import Team from "../../../src/components/ui/Team";
import Footer from "../../../src/components/ui/Footer";

const LandingPage = () => {
  return (
    <div className="bg-gray-50 text-gray-800">
      <Navbar />
      <HeroSection />
      <div className="">
        <ProblemStatement />
        <Solution />
        {/* <Features /> */}
        <Usecase />
        <Supervisor />
        <Team />
      </div>
      <Footer />
    </div>
  );
};

export default LandingPage;