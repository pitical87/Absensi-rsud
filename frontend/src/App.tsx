import TopNavbar from "./components/Client Page/TopNavbar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex justify-center">
      <div className="w-full md:w-md ">
        {/* top part */}
        <TopNavbar />
        <AppRoutes />
      </div>
    </div>
  );
}

export default App;
