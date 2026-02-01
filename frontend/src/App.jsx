import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Login from './Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(""); 
  
  // 📂 Files & History
  const [file, setFile] = useState(null); // The actual active file object
  const [recentFiles, setRecentFiles] = useState([]); // List of file names (Strings)
  const [chatHistory, setChatHistory] = useState([]); 
  
  // 💬 Chat State
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // ⚠️ Re-upload Prompt State
  const [reUploadNeeded, setReUploadNeeded] = useState(null); 

  // 👇 IMPORTANT: Use your RENDER URL here (No trailing slash)
  const API_URL = "https://datamind-backend-sm6k.onrender.com"; 

  // 1. Handle Login -> Fetch History & Files
  const handleLoginSuccess = async (status, username) => {
    setIsLoggedIn(status);
    setCurrentUser(username);

    try {
      // A. Get Old Chats
      const histRes = await axios.post(`${API_URL}/get_history`, { username, password: "" });
      if (histRes.data.history) setChatHistory(histRes.data.history);

      // B. Get Saved File Names
      const filesRes = await axios.post(`${API_URL}/get_user_files`, { username, password: "" });
      if (filesRes.data.files) setRecentFiles(filesRes.data.files);
      
    } catch (err) {
      console.error("Failed to load user data", err);
    }
  };

  // 2. Handle File Upload (Save to Backend)
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile); // Set active file
      setReUploadNeeded(null); // Clear warning
      setAnswer(""); setImage(null); // Clear old chat

      // Save filename to backend list
      try {
        await axios.post(`${API_URL}/add_file_record`, {
            username: currentUser,
            filename: selectedFile.name
        });
        
        // Update local list if new
        setRecentFiles(prev => {
            if (!prev.includes(selectedFile.name)) return [selectedFile.name, ...prev];
            return prev;
        });

      } catch (err) {
        console.error("Failed to save file record", err);
      }
    }
  };

  // 3. Select File from Sidebar
  const switchFile = (fileName) => {
    // Check if the currently uploaded 'file' matches this name
    if (file && file.name === fileName) {
        // Active file is ready!
        setReUploadNeeded(null);
        setAnswer(""); setImage(null);
        setQuery("");
    } else {
        // ⚠️ It's just a history name. We need the real file.
        setReUploadNeeded(fileName);
        setAnswer(""); setImage(null);
        setFile(null); // Clear active file until they upload
    }
  };

  const selectChatHistory = (item) => {
    setQuery(item.query);
    setAnswer(item.answer);
    setImage(null);
    setReUploadNeeded(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser("");
    setFile(null); setQuery(""); setAnswer(""); setImage(null); 
    setChatHistory([]); setRecentFiles([]); setReUploadNeeded(null);
  };

  const handleClear = () => {
    setQuery(""); setAnswer(""); setImage(null); setReUploadNeeded(null);
  };

  const handleAnalyze = async () => {
    if (!file) return alert("Please upload the file first! 📂");
    if (!query) return alert("Please ask a question!");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query);
    
    setLoading(true); setAnswer(""); setImage(null);

    try {
      const res = await axios.post(`${API_URL}/analyze`, formData);
      setAnswer(res.data.answer);
      if (res.data.image) setImage(res.data.image);

      const newEntry = {
        username: currentUser,
        filename: file.name,
        query: query,
        answer: res.data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      await axios.post(`${API_URL}/save_history`, newEntry);
      setChatHistory(prev => [newEntry, ...prev]);
      setQuery("");

    } catch (err) {
      setAnswer("⚠️ Connection Error: Unable to reach AI.");
    }
    setLoading(false);
  };

  if (!isLoggedIn) return <Login onLogin={handleLoginSuccess} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      
      {/* 🌑 LEFT SIDEBAR */}
      <div className="w-80 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl animate-pulse-slow">🤖</span>
            <h1 className="text-2xl font-extrabold tracking-tight">DataMind AI</h1>
          </div>
          <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold">User: {currentUser}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* 📂 FILES LIST */}
          <div>
            <label className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-3 block">Your Files</label>
            
            {/* Upload Button */}
            <div className={`relative group p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer mb-4 ${file ? "border-green-400 bg-green-500/10" : "border-indigo-400/30 hover:border-indigo-400 hover:bg-white/5"}`}>
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="text-center">
                <span className="text-2xl block mb-1">{file ? "✅" : "📂"}</span>
                <span className="text-xs font-bold text-indigo-100 group-hover:text-white transition">{file ? file.name : "New Upload"}</span>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
                {recentFiles.map((fileName, index) => (
                <button key={index} onClick={() => switchFile(fileName)} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${((file && file.name === fileName) || reUploadNeeded === fileName) ? "bg-indigo-600 border border-indigo-400" : "bg-white/5 hover:bg-white/10"}`}>
                    <span className="text-lg">📄</span>
                    <p className="text-sm font-bold truncate text-white">{fileName}</p>
                    {/* Active Indicator */}
                    {file && file.name === fileName && <span className="w-2 h-2 rounded-full bg-green-400 ml-auto"></span>}
                </button>
                ))}
            </div>
          </div>

          {/* 💬 HISTORY */}
          {chatHistory.length > 0 && (
            <div>
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-3 block">Saved Insights</label>
              <div className="space-y-2">
                {chatHistory.map((item, index) => (
                  <button key={index} onClick={() => selectChatHistory(item)} className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all group bg-white/5 hover:bg-white/10 border border-transparent hover:border-indigo-400/30">
                    <span className="text-lg">💬</span>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate text-indigo-100 group-hover:text-white">{item.query}</p>
                      <p className="text-[10px] text-indigo-400">{item.filename}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 text-indigo-300 hover:text-red-400 transition w-full p-2 rounded-lg hover:bg-white/5 group">
            <span className="text-lg">🚪</span><span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ☀️ RIGHT MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen relative bg-white">
        <header className="h-20 border-b border-slate-100 flex justify-between items-center px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Analytics Workspace</h2>
            <p className="text-sm text-slate-400 font-medium">
                {reUploadNeeded ? <span className="text-red-500">Action Required</span> : (file ? `Analyzing: ${file.name}` : "Select a file")}
            </p>
          </div>
          <button onClick={handleClear} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition flex items-center gap-2 px-4 py-2 rounded-full hover:bg-indigo-50">🧹 Clear Chat</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth">
          
          {/* ⚠️ RE-UPLOAD PROMPT (When clicking old file) */}
          {reUploadNeeded && !file && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up">
                <div className="bg-orange-50 p-8 rounded-2xl border border-orange-200 max-w-md">
                    <span className="text-5xl block mb-4">📂⚠️</span>
                    <h3 className="text-xl font-bold text-orange-800 mb-2">File Content Missing</h3>
                    <p className="text-orange-600 mb-6">
                        You selected <b>{reUploadNeeded}</b> from history. <br/>
                        Since we use a secure cloud server, the original file was cleared for privacy.
                    </p>
                    <label className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform active:scale-95 inline-block">
                        Upload {reUploadNeeded} Again 🚀
                        <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>
            </div>
          )}

          {!answer && !loading && !reUploadNeeded && (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 select-none">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"><span className="text-4xl grayscale opacity-50">📉</span></div>
              <p className="text-xl font-bold text-slate-400">Ready to visualize data</p>
            </div>
          )}

          {answer && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
              <div className="flex justify-end"><div className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl rounded-tr-none max-w-2xl text-lg font-medium shadow-sm">{query}</div></div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-md shrink-0">✨</div>
                <div className="flex-1 space-y-4">
                  {image && (<div className="p-2 bg-white rounded-2xl shadow-lg border border-slate-100 inline-block mb-4"><img src={`data:image/png;base64,${image}`} alt="Viz" className="rounded-xl max-h-[450px] w-auto" /></div>)}
                  <div className="bg-white p-8 rounded-2xl rounded-tl-none shadow-xl border border-slate-100 text-slate-700 prose prose-indigo max-w-none leading-relaxed"><ReactMarkdown>{answer}</ReactMarkdown></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT AREA (Disabled if re-upload needed) */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto relative group">
            <div className="relative flex items-center bg-white rounded-xl shadow-2xl">
              <input 
                type="text" 
                placeholder={reUploadNeeded ? "Please upload the file first..." : "Ask something about your data..."} 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} 
                disabled={!!reUploadNeeded} // Disable input if re-upload needed
                className="w-full pl-6 pr-32 py-5 bg-transparent border-none rounded-xl focus:ring-0 outline-none text-slate-700 text-lg placeholder-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed" 
              />
              <button onClick={handleAnalyze} disabled={loading || !!reUploadNeeded} className={`absolute right-2 top-2 bottom-2 px-8 rounded-lg font-bold text-white transition-all shadow-md transform active:scale-95 ${loading || reUploadNeeded ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-purple-500/30"}`}>{loading ? "..." : "Ask 🚀"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;