// Line 30-35 kita irukum
if (res.data.status === "success") {
  if (isRegistering) {
    setMessage("✅ Registered! Now please Login.");
    setIsRegistering(false);
    setPassword("");
  } else {
    // 👇 MUKKIYAMANA MATRRAM (Pass username too)
    onLogin(true, username); 
  }
}