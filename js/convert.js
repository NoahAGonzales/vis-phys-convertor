const { ipcRenderer } = require("electron")

/********************************************************************************************************************************
   Workers
*/
process.dlopen = () => {
	throw new Error('Load native module is not safe')
}
let worker = new Worker('../workers/convertor.js')

/********************************************************************************************************************************
 * Selecting the file
 */

let filePath = null
let fileName = null

function selectFile() {
   // Send a message to the main process open the dialog window for selecting a file
   ipcRenderer.send('selectFile', {})
}

ipcRenderer.on("file path", function(event, data) {
  if(data.canceled == false) {
    //Parse to find the file path selected by the user
    filePath = data.filePaths[0];
    // Split to the find the name of the file selected
    fileName = filePath.split('\\')[filePath.split('\\').length-1]
    //Display the file name chosen to the user
    document.getElementById('filename').innerHTML=fileName
    // Setting the image for analysis
    document.getElementById('img-for-analysis').src = filePath
  }
})

/********************************************************************************************************************************
 * Converting
 */

 function convertFile() {
	// Not converting if there is no file selected
	if(filePath != null) {
		// The mat for image analysis
		let src = cv.imread('img-for-analysis', cv.IMREAD_GRAYSCALE)
		// Variable to hold the pixel values of the image
		let pixelValues = [...Array(src.rows)].map(e => Array(src.cols).fill(null))
		//Storing the values of the pixels in the array
		for(let i = 0; i < src.rows; i++) {
			for (let j = 0; j < src.cols; j++) {
				pixelValues[i][j] = src.ucharAt(i, j * src.channels())
			}
		}
		worker.postMessage([filePath, fileName, pixelValues])
	}
}

/********************************************************************************************************************************
 * Progress bar
 */
const progressBar = document.getElementById('progress-bar')

/**
 * Returns the current width of the progress bar
 */
function getProgressBarWidth() {
  const computedStyle = getComputedStyle(progressBar)
  const width = parseFloat(computedStyle.getPropertyValue('--width')) || 0
  return width
}

/**
 * Update the progress bar with the given value
 * @param {number} newWidth - A positive number meant to be the new percent of the progress bar
 */
function updateProgressBar (newWidth) {
  progressBar.style.setProperty('--width', newWidth * 100)
}

/**
 * Listens to the convertor worker for updates on the pgoress of conversion
 */
worker.onmessage = function (e) {
  updateProgressBar(e.data[0])
}

