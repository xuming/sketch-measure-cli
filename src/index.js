const { join } = require('path')
const Transformer = require('./transform')
const parseSketchFile = require('./parseSketchFile')
const generatePage = require('./generateMeasurePage')
const {
  generatePreviewImages,
  generateSliceImages,
  rename
} = require('./generateImages')

module.exports = process

function process (sketchFile, dest) {
  const NAME_MAP = {}
  let transformer
  return parseSketchFile(sketchFile)
    // convert data
    .then(data => {
      transformer = new Transformer(data.meta, data.pages, {
        savePath: dest
      })
      const processedData = transformer.convert()
      processedData.artboards.forEach(artboard => {
        NAME_MAP[artboard.name] = artboard.slug
      })
      return generatePage(processedData, dest)
    })
    // process preview images
    .then(() => {
      return generatePreviewImages(sketchFile, join(dest, 'preview'))
        .then(images => {
          return Promise.all(
            images.map(name => {
              const correctName = NAME_MAP[name]
              return rename(
                join(dest, `preview/${name}@2x.png`),
                join(dest, `preview/${correctName}.png`)
              )
            })
          )
        })
    })
    // process slice images
    .then(() => {
      // NOTE: Maybe should use slice layer's scale here.
      return generateSliceImages(sketchFile, transformer.assetsPath, transformer.result.scale)
    })
}
