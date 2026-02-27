import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./Components/first/Welcome";
import Profession from "./Components/pages/Profession";
import MainPage from "./Components/pages/MainPage";
import MyWardrobe from "./Components/pages/MyWardrobe";
import CreateOutfit from "./Components/pages/CreateOutfit";
import OutfitDetail from "./Components/pages/OutfitDetail";
import SuggestOutfit from "./Components/pages/SuggestOutfit";
import Register from "./Components/Register/Register";
import Login from "./Components/login/Login";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/profession" element={<Profession />} />
        <Route path="/home" element={<MainPage />} />
        <Route path="/wardrobe" element={<MyWardrobe />} />
        <Route path="/create-outfit" element={<CreateOutfit />} />
        <Route path="/outfit/:id" element={<OutfitDetail />} />
        <Route path="/suggest-outfit" element={<SuggestOutfit />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
