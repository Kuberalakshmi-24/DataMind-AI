import { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page reload
    if(!username || !password) return alert("Please fill in all details");

    setLoading(true);
    setMessage("");

    const endpoint = isRegistering ? "register" : "login";
    
    try {
      const res = await axios.post(`https://datamind-backend-sm6k.onrender.com/${endpoint}`, {
        username: username,
        password: password
      });

      if (res.data.status === "success") {
        if (isRegistering) {
          setMessage("✅ Registered! Now please Login.");
          setIsRegistering(false);
          setPassword("");
        } else {
onLogin(true, username);        }
      } else {
        setMessage(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Server connection failed! Is backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full font-sans overflow-hidden bg-white">
      
      {/* 🌑 LEFT SIDE */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 text-center">
          <div className="mb-6 text-6xl animate-bounce-slow">🚀</div>
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Turn Data into <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Insights</span></h2>
          <p className="text-indigo-200 text-lg max-w-md mx-auto leading-relaxed">
            Upload your CSV files and let our AI analyze, visualize, and explain your data in seconds.
          </p>
        </div>
        <div className="absolute bottom-10 text-indigo-400 text-sm">© 2026 DataMind AI Project</div>
      </div>

      {/* 📝 RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 bg-white">
        <div className="w-full max-w-md">
          <div className="text-left mb-10">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">{isRegistering ? "Get Started" : "Welcome Back"}</h1>
            <p className="text-slate-500 text-lg">{isRegistering ? "Create your account now" : "Please enter your details"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            
            {/* 🛑 DUMMY INPUTS (To catch browser autofill) */}
            <div style={{ position: "absolute", opacity: 0, zIndex: -1 }}>
               <input type="text" name="dummy_user" />
               <input type="password" name="dummy_pass" />
            </div>

            {/* Username */}
            <div>
              <label className="block text-slate-700 font-bold mb-2 text-sm uppercase tracking-wide">Username</label>
              <input
                type="text"
                name="real_username_field"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition text-slate-800 font-medium"
                placeholder="Enter username"
                autoComplete="off"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-slate-700 font-bold mb-2 text-sm uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  // 👇 Normal logic: Text or Password (NO switching hacks)
                  type={showPassword ? "text" : "password"} 
                  
                  name="real_password_field"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition text-slate-800 font-medium"
                  placeholder="••••••••"
                  
                  // 👇 Prevent Browser Interference
                  autoComplete="new-password"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {message && (
              <div className={`text-sm font-bold p-3 rounded ${message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-white font-bold rounded-lg text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 ${loading ? "bg-slate-400" : "bg-indigo-900 hover:bg-indigo-800"}`}
            >
              {loading ? "Processing..." : (isRegistering ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setMessage(""); setShowPassword(false); }}
              className="ml-2 text-indigo-700 font-bold hover:underline"
            >
              {isRegistering ? "Sign in" : "Sign up for free"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;