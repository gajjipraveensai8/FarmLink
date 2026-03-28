// Basic backend test script

(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/health');
    if (res.ok) {
      console.log('Health check passed:', await res.json());
    } else {
      console.error('Health check failed:', res.status);
      process.exit(1);
    }
  } catch (err) {
    console.error('Health check failed to connect:', err.message);
    process.exit(1);
  }
})();
