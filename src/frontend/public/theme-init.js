try {
  const theme = window.localStorage.getItem('theme') || 'legacy'
  const colorMode = window.localStorage.getItem('color-mode') || 'dark'
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('dark', colorMode === 'dark')
} catch (error) {
  document.documentElement.dataset.theme = 'legacy'
  document.documentElement.classList.add('dark')
}
