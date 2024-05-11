#feature-id StatisticalStretch : Utilities > Statistical Stretch
#feature-info This script performs a determines dynamically statistical properties of the image and logirthmically stretches accordingly.

#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>

// include constants
#include <pjsr/ImageOp.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/UndoFlag.jsh>

#define TITLE "Statistical Astro Stretching"
#define VERSION "1.3.1"
#define DEBUGGING_MODE_ON false

// Global parameters object
var SHOParameters = {
    targetViewId: undefined,
    targetMedian: 0.25,
    curvesBoost: 0.00,
    numIterations: 1,
    normalizeImageRange: true,  // Default value for normalization

    newInstance: function() {
        console.writeln("New instance created.");
    },

    save: function() {
        Parameters.set("targetView", this.targetViewId);
        Parameters.set("targetMedian", this.targetMedian);
        Parameters.set("curvesBoost", this.curvesBoost);
        Parameters.set("numIterations", this.numIterations);
        Parameters.set("normalizeImageRange", this.normalizeImageRange);  // Save normalization setting
    },

    load: function() {
        if (Parameters.has("targetView"))
            this.targetView = ImageWindow.windowById(Parameters.getString("targetView")).mainView;
        if (Parameters.has("targetMedian"))
            this.targetMedian = Parameters.getReal("targetMedian");
        if (Parameters.has("curvesBoost"))
            this.curvesBoost = Parameters.getReal("curvesBoost");
        if (Parameters.has("numIterations"))
            this.numIterations = Parameters.getInteger("numIterations");
        if (Parameters.has("normalizeImageRange"))  // Load normalization setting
            this.normalizeImageRange = Parameters.getBoolean("normalizeImageRange");
    },

    main: function() {
        // Load parameters if available
        this.load();

        // Execute directly if there's a predefined target view (from Parameters)
        if (Parameters.isViewTarget && Parameters.targetView) {
            this.executeAlgorithm(this.numIterations);
        } else {
            // Otherwise, open the dialog for user input
            let dialog = new MyDialog();
            if (dialog.execute()) {
                // Check if a valid target view has been selected
                if (this.targetView && this.targetView.id) {
                    this.executeAlgorithm(this.numIterations);
                } else {
                    console.writeln("No target view specified.");
                }
            } else {
                console.writeln("Dialog execution cancelled.");
            }
        }
    },

    executeAlgorithm: function(iteration) {
        if (!this.targetView) {
            console.writeln("No target view specified.");
            return;
        }

        for (let i = 0; i < iteration; i++) {
            if (this.targetView.image.isColor) {
                processColorImage(this.targetView, this.targetMedian, i + 1);
            } else {
                processMonoImage(this.targetView, this.targetMedian, i + 1);
            }
        }

        if (iteration === this.numIterations && this.applyCurveTransformation) {
            applyFinalCurve(this.targetView, this.targetMedian);
        }
    }
};



// Call the load method to initialize parameters if needed
SHOParameters.load();


/// @class embedded preview for dialog.
///
/// use doUpdateImage() to set displayed image and STF.
/// largely based on code provided by Juan.
function BandingScrollControl( parent )
{
   this.__base__ = ScrollBox;
   this.__base__( parent );

   this.autoScroll = true;
   this.tracking = true;

   this.displayImage=null;
   this.dragging = false;
   this.dragOrigin = new Point( 0 );

   this.viewport.cursor = new Cursor( StdCursor_OpenHand );


   /// get current result image. May be null
   this.getImage=function(){
      return this.displayImage;
   };  //getImage()

   /// called to notify that a redraw of image is necessary with given image
   /// @param image: Image to be displayed
   /// @param stf: Screen transfer function to be applied. Can be null.
      this.doUpdateImage = function(image) {
        this.displayImage = image;
        this.initScrollBars();  // Make sure this method correctly calculates and sets scroll ranges
        this.viewport.update();  // Redraw the viewport to reflect the new image and scroll states
      };

// Ensure that scroll bar initialization method rechecks the necessity of scroll bars after every update
this.initScrollBars = function() {
    var image = this.getImage();  // Ensure this method accurately fetches the current image
    if (image == null || image.width <= 0 || image.height <= 0) {
        this.setHorizontalScrollRange(0, 0);
        this.setVerticalScrollRange(0, 0);
    } else {
        this.setHorizontalScrollRange(0, Math.max(0, image.width - this.viewport.width));
        this.setVerticalScrollRange(0, Math.max(0, image.height - this.viewport.height));
    }
    this.viewport.update();  // Make sure to update the viewport after setting scroll ranges
};

   this.viewport.onResize = function()
   {
      this.parent.initScrollBars();
   };  //onResize()

   this.onHorizontalScrollPosUpdated = function( x )
   {
      this.viewport.update();
   };  //onHorizontalScrollPosUpdated()

   this.onVerticalScrollPosUpdated = function( y )
   {
      this.viewport.update();
   };  // onVerticalScrollPosUpdated()

   this.viewport.onMousePress = function( x, y, button, buttons, modifiers )
   {
      this.cursor = new Cursor( StdCursor_ClosedHand );
      with ( this.parent )
      {
         dragOrigin.x = x;
         dragOrigin.y = y;
         dragging = true;
      }
   }; // onMousePress()

   this.viewport.onMouseMove = function( x, y, buttons, modifiers )
   {
      with ( this.parent )
      {
         if ( dragging )
         {
            scrollPosition = new Point( scrollPosition ).translatedBy( dragOrigin.x-x, dragOrigin.y-y );
            dragOrigin.x = x;
            dragOrigin.y = y;
         }
      }
   }; // onMouseMove()

   this.viewport.onMouseRelease = function( x, y, button, buttons, modifiers )
   {
      this.cursor = new Cursor( StdCursor_OpenHand );
      this.parent.dragging = false;
   }; // onMouseRelease()

   this.viewport.onPaint = function( x0, y0, x1, y1 )
   {
      if ( DEBUGGING_MODE_ON ){
         console.writeln("onPaint() entry");
      }
      var g = new Graphics( this );
      if ( DEBUGGING_MODE_ON ){
         console.writeln("onPaint() calling getImage()");
      }
      var result=this.parent.getImage();
      if ( DEBUGGING_MODE_ON ){
        console.writeln("onPaint() getImage() returned");
      }
      if (result==null){
         // no current image, just draw a red background
         g.fillRect( x0, y0, x1, y1, new Brush( 0xff000000 ) );
      }else{
         result.selectedRect = (new Rect( x0, y0, x1, y1 )).translated( this.parent.scrollPosition );
         g.drawBitmap( x0, y0, result.render() );
         result.resetRectSelection();
      }
      g.end();
      // do garbage collect. Otherwise system eats memory until it comes to a halt
      // when I scroll the preview
      gc();
      if ( DEBUGGING_MODE_ON ){
         console.writeln("onPaint() exit");
      }
   }; //onPaint()

   this.initScrollBars();
}  //class BandingScrollControl
BandingScrollControl.prototype = new ScrollBox;




function MyDialog() {
    this.__base__ = Dialog;
    this.__base__();

    this.previewControl = new BandingScrollControl(this);
    this.previewControl.setMinWidth(600);  // Set minimum width
    this.previewControl.setMinHeight(450); // Set minimum height

    this.previewControl.onPaint = function(x0, y0, x1, y1) {
        var g = new Graphics(this);
        var result = this.parent.displayImage;
        if (result == null) {
            g.fillRect(x0, y0, x1, y1, new Brush(0xff000000));
        } else {
            result.selectedRect = new Rect(x0, y0, x1, y1).translated(this.parent.scrollPosition);
            g.drawBitmap(x0, y0, result);
            result.resetRectSelection();
        }
        g.end();
    };


    // Function to create, resize and display a temporary image
    this.createTemporaryImage = function(selectedImage) {
        let window = new ImageWindow(selectedImage.width, selectedImage.height,
                                     selectedImage.numberOfChannels,
                                     selectedImage.bitsPerSample,
                                     selectedImage.isReal,
                                     selectedImage.isColor
                                     );

        // Assign image to the temporary window's main view
        window.mainView.beginProcess();
        window.mainView.image.assign(selectedImage);
        window.mainView.endProcess();

        // Resample the image in the window
        var P = new IntegerResample;

    if (this.autoResizeCheckbox.checked) {
        // Calculate the zoom factor based on width only to fit the preview window horizontally
        const previewWidth = this.previewControl.width;
        const widthScale = Math.floor(selectedImage.width / previewWidth);
        const minScale = Math.max(widthScale, 1); // Ensure at least a scale of 1
        P.zoomFactor = -minScale; // Use the negative for reduction
    } else {
        // Use a default zoom factor of -2
        P.zoomFactor = -2;
    }

    P.executeOn(window.mainView);

        // Extract the image data before closing the window
        let resizedImage = new Image(window.mainView.image);


     // Check if the image has valid dimensions
        if (resizedImage.width > 0 && resizedImage.height > 0) {
      // After setting the resized image to the previewControl
      this.previewControl.displayImage = resizedImage;
      this.previewControl.doUpdateImage(resizedImage);  // This method should handle setting the image and initializing scroll bars
      this.previewControl.initScrollBars();  // Add this line to force recheck of scroll bars right after updating
        } else {
            console.error("Resized image has invalid dimensions.");
        }

        window.forceClose();  // Close the temporary window before setting to display control
    };
    // Main layout sizer
    this.sizer = new VerticalSizer;
    this.sizer.spacing = 6;
    this.sizer.margin = 10;

    // Title and instructions setup
    this.titleSizer = new VerticalSizer;
    this.titleSizer.spacing = 4;
    this.titleBox = new Label(this);
    this.titleBox.text = "Statistical Stretch " + VERSION;
    this.titleBox.textAlignment = TextAlign_Center;
    this.titleBox.frameStyle = FrameStyle_Box;
    this.titleBox.styleSheet = "font-weight: bold; font-size: 14pt; background-color: #f0f0f0;";
    this.titleBox.setFixedHeight(30);
    this.titleSizer.add(this.titleBox);

    this.instructionsBox = new Label(this);
    this.instructionsBox.text = "Select your image in the dropdown.\n\nUse the slider to adjust your Target Median Value.\n0.10 is a good start for distinct objects eg galaxy or PN.\n0.25 is a good start for distended objects like nebula filling the image.\nIterate successively to optionally reach statistical equilibrium.\n\nUse Preview Refresh to Update the Preview.\n\nOptional checkbox to Normalize the image to fill the range [0,1]";
    this.instructionsBox.textAlignment = TextAlign_Left;
    this.instructionsBox.frameStyle = FrameStyle_Box;
    this.instructionsBox.styleSheet = "font-size: 10pt; padding: 10px; background-color: #e6e6fa;";
    this.instructionsBox.setFixedHeight(160);
    this.titleSizer.add(this.instructionsBox);
    this.sizer.add(this.titleSizer);

   // Image selection setup
   this.imageSizer = new HorizontalSizer;
   this.imageLabel = new Label(this);
   this.imageLabel.text = "Select Image to Stretch:";
   this.imageLabel.textAlignment = TextAlign_Left;
   this.imageList = new ComboBox(this);
   this.imageList.onItemSelected = (index) => {
       var window = ImageWindow.windowById(this.imageList.itemText(index));
       if (window && !window.isNull) {
          this.targetView = window.mainView; // Ensure this is being set correctly
           var selectedImage = window.mainView.image;
           var tmpImage = this.createTemporaryImage(selectedImage);
           this.previewControl.displayImage = tmpImage;
           this.previewControl.initScrollBars();
           this.previewControl.viewport.update();
           // Trigger preview refresh directly after setting the image
           this.processPreview(selectedImage); // Assuming processPreview is the method that handles the refresh

           // Save the selected view ID to global parameters for persistence
           SHOParameters.targetViewId = window.mainView.id; // Ensure SHOParameters has a property for targetViewId
           SHOParameters.save(); // Call save function to store parameters
       }
   };

    this.imageList.addItem("Select an image");
    for (var i = 0; i < ImageWindow.windows.length; ++i) {
        this.imageList.addItem(ImageWindow.windows[i].mainView.id);
    }
    this.imageList.currentItem = 0;
    this.imageList.editEnabled = false;
    this.imageList.dropdownWidth = 450;
    this.imageList.setMinWidth(450);
    this.imageSizer.add(this.imageLabel);
    this.imageSizer.add(this.imageList);
    this.sizer.add(this.imageSizer);

    // Numeric control for target median
    this.targetMedianControl = new NumericControl(this);
    this.targetMedianControl.label.text = "Target Median:";
    this.targetMedianControl.setRange(0, 1);
    this.targetMedianControl.slider.setRange(0, 100);
    this.targetMedianControl.slider.scale = 0.01;
    this.targetMedianControl.setValue(0.25);
    this.targetMedianControl.setPrecision(2);
    this.targetMedianControl.onValueUpdated = (value) => {
        SHOParameters.targetMedian = value;
    };
    this.sizer.add(this.targetMedianControl);

    // Numeric control for iterations
    this.iterationsControl = new NumericControl(this);
    this.iterationsControl.label.text = "Number of Iterations:";
    this.iterationsControl.setRange(1, 5);
    this.iterationsControl.setValue(SHOParameters.numIterations);
    this.iterationsControl.setPrecision(0);
    this.iterationsControl.onValueUpdated = (value) => {
        SHOParameters.numIterations = value;
    };
    this.sizer.add(this.iterationsControl);

    // Numeric control for curves boost
    this.curvesBoostSlider = new NumericControl(this);
    this.curvesBoostSlider.label.text = "Curves Boost:";
    this.curvesBoostSlider.setRange(0.00, 0.30);
    this.curvesBoostSlider.slider.setRange(0, 300);
    this.curvesBoostSlider.slider.scale = 0.001;
    this.curvesBoostSlider.setValue(0.00);
    this.curvesBoostSlider.setPrecision(2);
    this.curvesBoostSlider.onValueUpdated = (value) => {
        SHOParameters.curvesBoost = value;
    };
    this.sizer.add(this.curvesBoostSlider);

        // Checkbox for normalizing image range
    this.normalizeImageRangeCheckbox = new CheckBox(this);
    this.normalizeImageRangeCheckbox.text = "Normalize Image Range to [0,1]";
    this.normalizeImageRangeCheckbox.checked = SHOParameters.normalizeImageRange;
    this.normalizeImageRangeCheckbox.onCheck = (checked) => {
        SHOParameters.normalizeImageRange = checked;
    };
    this.sizer.add(this.normalizeImageRangeCheckbox);

    // Footer with authorship and website information
    this.authorshipLabel = new Label(this);
    this.authorshipLabel.text = "Written by Franklin Marek";
    this.authorshipLabel.textAlignment = TextAlign_Center;
    this.sizer.add(this.authorshipLabel);

    this.websiteLabel = new Label(this);
    this.websiteLabel.text = "www.setiastro.com";
    this.websiteLabel.textAlignment = TextAlign_Center;
    this.sizer.add(this.websiteLabel);

    // Button setup
    this.buttonSizer = new HorizontalSizer;
    this.buttonSizer.spacing = 6;
    this.newInstanceButton = new ToolButton(this);
    this.newInstanceButton.icon = this.scaledResource(":/process-interface/new-instance.png");
    this.newInstanceButton.setScaledFixedSize(24, 24);
    this.newInstanceButton.toolTip = "New Instance";
    this.newInstanceButton.onMousePress = () => {
        SHOParameters.save();
        this.newInstance();
    };
    this.buttonSizer.add(this.newInstanceButton);
        this.buttonSizer.addStretch();



// Auto Resize Checkbox setup
this.autoResizeCheckbox = new CheckBox(this);
this.autoResizeCheckbox.text = "Auto Resize to Fit Preview";
this.autoResizeCheckbox.checked = true; // Default to not checked

// Event handler for checkbox changes
this.autoResizeCheckbox.onCheck = (checked) => {
    console.noteln("Auto Resize Checkbox state changed. Refreshing preview...");
    if (this.imageList.currentItem > 0) { // Ensure an image is selected
        var window = ImageWindow.windowById(this.imageList.itemText(this.imageList.currentItem));
        if (window && !window.isNull) {
            var selectedImage = window.mainView.image;
            if (selectedImage) {
                console.writeln("Processing image with ID: " + window.mainView.id);
                this.processPreview(selectedImage); // Ensure selectedImage is not undefined here
            } else {
                console.error("selectedImage is undefined.");
            }
        }
    } else {
        console.writeln("No image selected for preview!");
    }
};

// Add the checkbox to the buttonSizer
this.buttonSizer.add(this.autoResizeCheckbox);
    this.buttonSizer.addStretch();

    this.executeButton = new PushButton(this);
    this.executeButton.text = "Execute";
    this.executeButton.onClick = () => {
        let iterations = this.iterationsControl.value;
        this.executeAlgorithm(iterations);
    };
    this.buttonSizer.add(this.executeButton);
    this.sizer.add(this.buttonSizer);

// Function to process the temporary image for preview purposes
this.processPreview = function(selectedImage) {
    console.writeln("Starting processPreview...");
    let processingWindow = new ImageWindow(
        selectedImage.width,
        selectedImage.height,
        selectedImage.numberOfChannels,
        selectedImage.bitsPerSample,
        selectedImage.isReal,
        selectedImage.isColor
    );

    if (!processingWindow || processingWindow.isNull) {
        console.writeln("Failed to create processing window.");
        return;
    }

    processingWindow.hide();
    processingWindow.mainView.beginProcess();
    processingWindow.mainView.image.assign(selectedImage);
    processingWindow.mainView.endProcess();

    // Process the image in the new window's view
    for (let i = 0; i < this.iterationsControl.value; i++) {
        if (processingWindow.mainView.image.isColor) {
            console.writeln("Processing color image...");
            processColorImage(processingWindow.mainView, SHOParameters.targetMedian, i + 1);
        } else {
            console.writeln("Processing mono image...");
            processMonoImage(processingWindow.mainView, SHOParameters.targetMedian, i + 1);
        }
    }

      // Apply final curve based on curvesBoost value
      if (SHOParameters.curvesBoost > 0) {
          applyFinalCurve(processingWindow.mainView, SHOParameters.targetMedian);
      }

    // After processing, use the dedicated method to create a temporary image from the processed window
    let tempImage = this.createTemporaryImage(processingWindow.mainView.image);
    if (tempImage) {
        this.previewControl.displayImage = tempImage;
        this.previewControl.update(); // Make sure this method refreshes the display
    } else {
        //console.writeln("Failed to create a temporary image for preview.");
    }

    // Close the processing window
    processingWindow.forceClose(); // Use appropriate method to close the window
};


   // Preview Refresh button
   this.previewButton = new PushButton(this);
   this.previewButton.text = "Preview Refresh";
this.previewButton.onClick = () => {
    if (this.imageList.currentItem !== 0) { // Ensure an image is selected
        var window = ImageWindow.windowById(this.imageList.itemText(this.imageList.currentItem));
        if (window && !window.isNull) {
            var selectedImage = window.mainView.image;
            if (selectedImage) {
                console.writeln("Processing image with ID: " + window.mainView.id);
                this.processPreview(selectedImage); // Ensure selectedImage is not undefined here
            } else {
                console.error("selectedImage is undefined.");
            }
        }
    } else {
        console.writeln("No image selected for preview!");
    }
};
   this.sizer.add(this.previewButton);

    // Add the preview control to the main layout ensuring it expands
    this.sizer.add(this.previewControl, 1, Align_Expand);

    // Setup the window title and adjust dialog contents to fit
    this.windowTitle = TITLE;
    this.adjustToContents();
}

MyDialog.prototype = new Dialog;


MyDialog.prototype.executeAlgorithm = function(iteration) {
    if (this.imageList.currentItem < 0) {
        new MessageBox("No image selected for processing.", TITLE, StdIcon_Error, StdButton_Ok).execute();
        return;
    }

    let targetView = ImageWindow.windowById(this.imageList.itemText(this.imageList.currentItem)).mainView;
    console.writeln("Target View ID:", targetView.id);

    for (let i = 0; i < iteration; i++) {
        if (targetView.image.isColor) {
            console.writeln("Processing color image...");
            processColorImage(targetView, SHOParameters.targetMedian, i + 1);
        } else {
            console.writeln("Processing mono image...");
            processMonoImage(targetView, SHOParameters.targetMedian, i + 1);
        }
    }

    if (iteration === this.iterationsControl.value && SHOParameters.curvesBoost > 0) {
        console.writeln("Applying final curve...");
        applyFinalCurve(targetView, SHOParameters.targetMedian);
    }
};


function applyFinalCurve(targetView, targetMedian) {
    let P = new CurvesTransformation();
    P.Bt = CurvesTransformation.prototype.AkimaSubsplines;
      // In your CurvesTransformation setup
      P.K = [
          [0.00000, 0.00000],
          [0.5 * SHOParameters.targetMedian, 0.5 * SHOParameters.targetMedian],
          [SHOParameters.targetMedian, SHOParameters.targetMedian],
          [(3 * SHOParameters.targetMedian + 1) / 4, 0.25 * (-3 * SHOParameters.curvesBoost * SHOParameters.targetMedian + 3 * SHOParameters.curvesBoost + 3 * SHOParameters.targetMedian + 1)],
          [1.00000, 1.00000]
      ];

    P.St = CurvesTransformation.prototype.AkimaSubsplines;
    P.executeOn(targetView);
    console.noteln("Final Sigma Curves applied successfully after all iterations.");
}

function processMonoImage(targetView, targetMedian, iteration) {
    var P = new ProcessContainer;

    var P001 = new PixelMath;
    P001.expression = "BlackPoint = iif((med($T) - 2.7*sdev($T))<min($T),min($T),med($T) - 2.7*sdev($T));\n" +
                      "Rescaled = ($T - BlackPoint) / (1 - BlackPoint);";
    P001.useSingleExpression = true;
    P001.symbols = "BlackPoint, Rescaled, CurrentMedian, DesiredMedian, Alpha";
    P001.clearImageCacheAndExit = false;
    P001.cacheGeneratedImages = false;
    P001.generateOutput = true;
    P001.singleThreaded = false;
    P001.optimization = true;
    P001.use64BitWorkingImage = true;
    P001.rescale = false;
    P001.rescaleLower = 0;
    P001.rescaleUpper = 1;
    P001.truncate = true;
    P001.truncateLower = 0;
    P001.truncateUpper = 1;
    P001.createNewImage = false;
    P001.showNewImage = true;
    P.add(P001);

    var P002 = new PixelMath;
    P002.expression = "L=log((Med($T)*" + targetMedian + "-(" + targetMedian + "))/(Med($T)*(" + targetMedian + "-1)))/log(3);\n" +
                      "S=(3^L*$T)/((3^L-1)*$T+1);";
    P002.useSingleExpression = true;
    P002.symbols = "L, S";
    P002.clearImageCacheAndExit = false;
    P002.cacheGeneratedImages = false;
    P002.generateOutput = true;
    P002.singleThreaded = false;
    P002.optimization = true;
    P002.use64BitWorkingImage = true;
    P002.rescale = false;
    P002.rescaleLower = 0;
    P002.rescaleUpper = 1;
    P002.truncate = true;
    P002.truncateLower = 0;
    P002.truncateUpper = 1;
    P002.createNewImage = false;
    P002.showNewImage = true;
    P.add(P002);

    var P003 = new PixelMath;
    // Check the current state of normalization and set the expression accordingly
    if (SHOParameters.normalizeImageRange) {
        P003.expression = "$T/max($T)";
    } else {
        P003.expression = "$T;";
    }
   P003.useSingleExpression = true;
   P003.symbols = "L, Mcolor, S";
   P003.clearImageCacheAndExit = false;
   P003.cacheGeneratedImages = false;
   P003.generateOutput = true;
   P003.singleThreaded = false;
   P003.optimization = true;
   P003.use64BitWorkingImage = true;
   P003.rescale = false;
   P003.rescaleLower = 0;
   P003.rescaleUpper = 1;
   P003.truncate = true;
   P003.truncateLower = 0;
   P003.truncateUpper = 1;
   P003.createNewImage = false;
   P003.showNewImage = true;
   P.add(P003);

    // Execute the process container on the selected target image
 P.executeOn(targetView);
    console.noteln("Mono Image Statistical Stretch completed successfully for iteration " + iteration + ".");
}

function processColorImage(targetView, targetMedian, iteration) {
       var P = new ProcessContainer;

    var P001 = new PixelMath;
    P001.expression = "MedColor=avg(med($T[0]),med($T[1]),med($T[2]));\n" +
                      "MinColor=min(min($T[0]),min($T[1]),min($T[2]));\n" +
                      "SDevColor=avg(sdev($T[0]),sdev($T[1]),sdev($T[2]));\n" +
                      "BlackPoint = iif((MedColor - 2.7*SDevColor)<MinColor,MinColor,MedColor - 2.7*SDevColor);\n" +
                      "Rescaled = ($T - BlackPoint) / (1 - BlackPoint);";
    P001.useSingleExpression = true;
    P001.symbols = "BlackPoint, Rescaled, MedColor, MinColor, SDevColor";
    P001.clearImageCacheAndExit = false;
    P001.cacheGeneratedImages = false;
    P001.generateOutput = true;
    P001.singleThreaded = false;
    P001.optimization = true;
    P001.use64BitWorkingImage = true;
    P001.rescale = false;
    P001.rescaleLower = 0;
    P001.rescaleUpper = 1;
    P001.truncate = true;
    P001.truncateLower = 0;
    P001.truncateUpper = 1;
    P001.createNewImage = false;
    P001.showNewImage = true;
    P.add(P001);

    var P002 = new PixelMath;
    P002.expression = "MedianColor = avg(Med($T[0]),Med($T[1]),Med($T[2]));\n" +
                      "L=log((MedianColor*" + targetMedian + "-(" + targetMedian + "))/(MedianColor*(" + targetMedian + "-1)))/log(3);\n" +
                      "S=(3^L*$T)/((3^L-1)*$T+1);";
    P002.useSingleExpression = true;
    P002.symbols = "L, MedianColor, S";
    P002.clearImageCacheAndExit = false;
    P002.cacheGeneratedImages = false;
    P002.generateOutput = true;
    P002.singleThreaded = false;
    P002.optimization = true;
    P002.use64BitWorkingImage = true;
    P002.rescale = false;
    P002.rescaleLower = 0;
    P002.rescaleUpper = 1;
    P002.truncate = true;
    P002.truncateLower = 0;
    P002.truncateUpper = 1;
    P002.createNewImage = false;
    P002.showNewImage = true;
    P.add(P002);

    var P003 = new PixelMath;
    // Check the current state of normalization and set the expression accordingly
    if (SHOParameters.normalizeImageRange) {
        P003.expression = "Mcolor=max(max($T[0]),max($T[1]),max($T[2]));\n" +
                          "$T/Mcolor;";
    } else {
        P003.expression = "$T;";
    }
   P003.useSingleExpression = true;
   P003.symbols = "L, Mcolor, S";
   P003.clearImageCacheAndExit = false;
   P003.cacheGeneratedImages = false;
   P003.generateOutput = true;
   P003.singleThreaded = false;
   P003.optimization = true;
   P003.use64BitWorkingImage = true;
   P003.rescale = false;
   P003.rescaleLower = 0;
   P003.rescaleUpper = 1;
   P003.truncate = true;
   P003.truncateLower = 0;
   P003.truncateUpper = 1;
   P003.createNewImage = false;
   P003.showNewImage = true;
   P.add(P003);

    // Execute the process container on the selected target image
 P.executeOn(targetView);
    console.noteln("Color Image Statistical Stretch completed successfully for iteration " + iteration + ".");
};

function main() {
    Console.show();

    if (Parameters.isGlobalTarget) {
        // Block execution in global context to prevent issues
        Console.criticalln("This script cannot run in a global context.");
        return;
    }

    let dialog = new MyDialog();
    if (dialog.execute()) {
        dialog.executeAlgorithm(dialog.iterationsControl.value);
    } else {
        console.noteln("Dialog execution cancelled or closed without selection.");
    }
}



main();


