import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Login from './Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [file, setFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const exists = history.find((item) => item.name === selectedFile.name);
      if (!exists) {
        setHistory(prev => [{
          name: selectedFile.name, 
          fileObj: selectedFile, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);
      }
    }
  };

  const selectFromHistory = (historyItem) => {
    setFile(historyItem.fileObj);
    setAnswer("");
    setImage(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setFile(null); setQuery(""); setAnswer(""); setImage(null); setHistory([]);
  };

  const handleClear = () => {
    setQuery(""); setAnswer(""); setImage(null);
  };

  const handleAnalyze = async () => {
    if (!file || !query) return alert("Please upload a file and ask a question! 📂");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query);
    setLoading(true); setAnswer(""); setImage(null);

    try {
      const res = await axios.post("https://datamind-backend-sm6k.onrender.com/analyze", formData);
      setAnswer(res.data.answer);
      if (res.data.image) setImage(res.data.image);
    } catch (err) {
      setAnswer("⚠️ Connection Error: Unable to reach the AI backend.");
    }
    setLoading(false);
  };

  if (!isLoggedIn) return <Login onLogin={setIsLoggedIn} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      
      {/* 🌑 LEFT SIDEBAR */}
      <div className="w-80 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl animate-pulse-slow">🤖</span>
            <h1 className="text-2xl font-extrabold tracking-tight">DataMind AI</h1>
          </div>
          <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold">Enterprise Dashboard</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div>
            <label className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-3 block">New Upload</label>
            <div className={`relative group p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${file ? "border-green-400 bg-green-500/10" : "border-indigo-400/30 hover:border-indigo-400 hover:bg-white/5"}`}>
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="text-center">
                <span className="text-2xl block mb-1">{file ? "✅" : "📂"}</span>
                <span className="text-xs font-bold text-indigo-100 group-hover:text-white transition">{file ? "File Selected" : "Click to Upload CSV"}</span>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-3 block flex justify-between items-center">
                <span>Recent Datasets</span>
                <span className="bg-indigo-700 text-[10px] px-2 py-0.5 rounded-full text-white">{history.length}</span>
              </label>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <button key={index} onClick={() => selectFromHistory(item)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all group ${file && file.name === item.name ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg border border-indigo-400" : "bg-white/5 hover:bg-white/10 border border-transparent"}`}>
                    <span className="text-lg">📊</span>
                    <div className="overflow-hidden">
                      <p className={`text-sm font-bold truncate ${file && file.name === item.name ? "text-white" : "text-indigo-100 group-hover:text-white"}`}>{item.name}</p>
                      <p className="text-[10px] text-indigo-400">Uploaded at {item.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20 shrink-0 space-y-3">
           <div className="flex items-center gap-3 px-2">
               <div className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`}></div>
               <span className="text-xs font-medium text-indigo-200">{loading ? "AI Processing..." : "System Online"}</span>
           </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-indigo-300 hover:text-red-400 transition w-full p-2 rounded-lg hover:bg-white/5 group">
            <span className="text-lg group-hover:rotate-12 transition">🚪</span><span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ☀️ RIGHT MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen relative bg-white">
        <header className="h-20 border-b border-slate-100 flex justify-between items-center px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Analytics Workspace</h2>
            <p className="text-sm text-slate-400 font-medium">{file ? `Analyzing: ${file.name}` : "No file selected"}</p>
          </div>
          <button onClick={handleClear} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition flex items-center gap-2 px-4 py-2 rounded-full hover:bg-indigo-50">🧹 Clear Chat</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth">
          {!answer && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 select-none">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"><span className="text-4xl grayscale opacity-50">📉</span></div>
              <p className="text-xl font-bold text-slate-400">Ready to visualize data</p>
              <p className="text-sm text-slate-400 mt-2">Select a dataset from the sidebar to begin</p>
            </div>
          )}

          {answer && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
              <div className="flex justify-end">
                 <div className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl rounded-tr-none max-w-2xl text-lg font-medium shadow-sm">{query}</div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-md shrink-0">✨</div>
                <div className="flex-1 space-y-4">
                  
                  {/* 👇 CHANGED ORDER: Image First, Then Text 👇 */}
                  
                  {/* 1. Chart (Top) */}
                  {image && (
                    <div className="p-2 bg-white rounded-2xl shadow-lg border border-slate-100 inline-block mb-4">
                      <img src={`data:image/png;base64,${image}`} alt="Data Visualization" className="rounded-xl max-h-[450px] w-auto" />
                    </div>
                  )}

                  {/* 2. Text Explanation (Bottom) */}
                  <div className="bg-white p-8 rounded-2xl rounded-tl-none shadow-xl border border-slate-100 text-slate-700 prose prose-indigo max-w-none leading-relaxed">
                    <ReactMarkdown>{answer}</ReactMarkdown>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white rounded-xl shadow-2xl">
              <input type="text" placeholder="Ask something about your data..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} className="w-full pl-6 pr-32 py-5 bg-transparent border-none rounded-xl focus:ring-0 outline-none text-slate-700 text-lg placeholder-slate-400" />
              <button onClick={handleAnalyze} disabled={loading} className={`absolute right-2 top-2 bottom-2 px-8 rounded-lg font-bold text-white transition-all shadow-md transform active:scale-95 ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-purple-500/30"}`}>{loading ? "..." : "Ask 🚀"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;