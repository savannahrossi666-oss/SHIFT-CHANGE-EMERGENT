import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import useLenis from "@/hooks/useLenis";
import Nav from "@/components/site/Nav";
import Hero from "@/components/site/Hero";
import Problem from "@/components/site/Problem";
import Shift from "@/components/site/Shift";
import SplitCards from "@/components/site/SplitCards";
import Mission from "@/components/site/Mission";
import Transformation from "@/components/site/Transformation";
import Closing from "@/components/site/Closing";
import Footer from "@/components/site/Footer";

const Home = () => {
  useLenis();

  return (
    <main
      data-testid="home-page"
      className="relative bg-[#08090a] text-[#f7f8f8] overflow-x-hidden"
    >
      <Nav />
      <Hero />
      <Problem />
      <Shift />
      <SplitCards />
      <Mission />
      <Transformation />
      <Closing />
      <Footer />
    </main>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
