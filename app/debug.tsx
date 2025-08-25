export default function DebugPage() {
  console.log('Debug page is rendering')
  return (
    <div style={{ 
      background: 'red', 
      color: 'white', 
      padding: '20px', 
      fontSize: '24px',
      minHeight: '100vh'
    }}>
      <h1>DEBUG PAGE</h1>
      <p>If you can see this, React is working</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}
