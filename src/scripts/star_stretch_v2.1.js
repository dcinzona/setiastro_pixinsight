#feature-id   StarStretch : Utilities > Star Stretch
#feature-info This script performs a stretch of a linear star image, boosts color, and removes any green cast.

#include <pjsr/Sizer.jsh>          // needed to instantiate the VerticalSizer and HorizontalSizer objects
#include <pjsr/NumericControl.jsh> // needed to instantiate the NumericControl control

// define a global variable containing script's parameters
var StarStretchParameters = {
   amount: 5,
   targetView: undefined,
   satAmount: 1, // Default saturation amount
   saturationLevel: [
      [0.00000, 0.40000],
      [0.50000, 0.70000],
      [1.00000, 0.40000]
   ],

   // stores the current parameters values into the script instance
   save: function() {
      Parameters.set("amount", StarStretchParameters.amount);
      Parameters.set("satAmount", StarStretchParameters.satAmount);
   },

   // loads the script instance parameters
   load: function () {
      if (Parameters.has("amount"))
         StarStretchParameters.amount = Parameters.getReal("amount");
      if (Parameters.has("satAmount"))
         StarStretchParameters.satAmount = Parameters.getReal("satAmount");
   },

   // Update saturation level matrix based on satAmount
   updateSaturationLevel: function() {
      var satAmount = StarStretchParameters.satAmount;
      StarStretchParameters.saturationLevel = [
         [0.00000, satAmount * 0.40000],
         [0.50000, satAmount * 0.70000],
         [1.00000, satAmount * 0.40000]
      ];
   }
}

function applyPixelMath(view, amount) {
   // Instantiate the PixelMath process
   var P = new PixelMath;
   P.expression = "((3^" + amount + ")*$T)/((3^" + amount + " - 1)*$T + 1)";

   // Perform the pixel math transformation
   P.executeOn(view);
}

function applyColorSaturation(view, satAmount) {
   // Instantiate the ColorSaturation process
   var P = new ColorSaturation;
   P.HS = StarStretchParameters.saturationLevel;
   P.HSt = ColorSaturation.prototype.AkimaSubsplines;
   P.hueShift = 0.000;

   // Perform the colorsaturation transformation
   P.executeOn(view);
}


function applySCNR(view) {
   var P = new SCNR;
   P.amount = 1.00;
   P.protectionMethod = SCNR.prototype.AverageNeutral;
   P.colorToRemove = SCNR.prototype.Green;
   P.preserveLightness = true;

   P.executeOn(view);
}

/*
 * Construct the script dialog interface
 */
function StarStretchDialog() {
   this.__base__ = Dialog;
   this.__base__();

   // let the dialog to be resizable by dragging its borders
   this.userResizable = true;

   // set the minimum width of the dialog
   this.scaledMinWidth = 450;

   // create a title area
   // 1. sets the formatted text
   // 2. sets read only, we don't want to modify it
   // 3. sets the background color
   // 4. sets a fixed height, the control can't expand or contract
   this.title = new TextBox(this);
   this.title.text = "<b>Star Stretch v2.1: Linear to Non-Linear Stretch of Color Star Image</b><br><br>" +
    "Please select your <b>combined </b>stars only image to stretch<br>" +
    "Default value is a stretch of " + StarStretchParameters.amount + "<br>" +
    "Default color boost value is " + StarStretchParameters.satAmount + "<br><br>" +
    "Written by Franklin Marek";
   this.title.readOnly = true;
   this.title.backgroundColor = 0xf7f7c625;
   this.title.minHeight = 140;
   this.title.maxHeight = 140;

   // add a view picker
   // 1. retrieve the whole view list (images and previews)
   // 2. sets the initially selected view
   // 3. sets the selection callback: the target view becomes the selected view
   this.viewList = new ViewList(this);
   this.viewList.getAll();
   StarStretchParameters.targetView = this.viewList.currentView;
   this.viewList.onViewSelected = function (view) {
      StarStretchParameters.targetView = view;
   }

   // create the input slider for Stretch Amount
   this.AmountControl = new NumericControl(this);
   this.AmountControl.label.text = "Stretch Amount:";
   this.AmountControl.label.width = 120;
   this.AmountControl.setRange(0, 8);
   this.AmountControl.setPrecision(2);
   this.AmountControl.slider.setRange(0, 100);
   this.AmountControl.setValue(StarStretchParameters.amount); // Set the default value
   this.AmountControl.toolTip = "<p>Adjust above 5 with caution.</p>";
   this.AmountControl.onValueUpdated = function (value) {
      StarStretchParameters.amount = value;
   };

   // create the input slider for Saturation Amount
   this.SaturationAmountControl = new NumericControl(this);
   this.SaturationAmountControl.label.text = "Color Boost Amount:";
   this.SaturationAmountControl.label.width = 120;
   this.SaturationAmountControl.setRange(0, 2);
   this.SaturationAmountControl.setPrecision(2);
   this.SaturationAmountControl.slider.setRange(0, 200);
   this.SaturationAmountControl.setValue(StarStretchParameters.satAmount); // Set the default value
   this.SaturationAmountControl.toolTip = "<p>Adjust the color saturation amount.</p>";
   this.SaturationAmountControl.onValueUpdated = function (value) {
      StarStretchParameters.satAmount = value;
      StarStretchParameters.updateSaturationLevel(); // Update the saturation level matrix
   };

   // prepare the execution button
   // 1. sets the text
   // 2. sets a fixed width
   // 3. sets the onClick function
   this.execButton = new PushButton(this);
   this.execButton.text = "Execute";
   this.execButton.width = 40;
   this.execButton.onClick = () => {
      this.ok();
   };

   // Add create instance button
   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource(":/process-interface/new-instance.png");
   this.newInstanceButton.setScaledFixedSize(24, 24);
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = () => {
      // stores the parameters
      StarStretchParameters.save();
      // create the script instance
      this.newInstance();
   };

   // create a horizontal slider to layout the execution button
   // 1. sets the margins
   // 2. add the newInstanceButton, a spacer and the execButton
   this.execButtonSizer = new HorizontalSizer;
   this.execButtonSizer.margin = 8;
   this.execButtonSizer.add(this.newInstanceButton)
   this.execButtonSizer.addStretch();
   this.execButtonSizer.add(this.execButton)


   // layout the dialog
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.add(this.title);
   this.sizer.addSpacing(8);
   this.sizer.add(this.viewList);
   this.sizer.addSpacing(8);
   this.sizer.add(this.AmountControl);
   this.sizer.addSpacing(8);
   this.sizer.add(this.SaturationAmountControl);
   this.sizer.addSpacing(8);
   this.sizer.add(this.execButtonSizer);
   this.sizer.addStretch();
}

StarStretchDialog.prototype = new Dialog;

// Function to check if the view is grayscale
function isGrayscale(view) {
    return !view.image.isColor;
}

// Modify the main execution logic
function main() {
    // hide the console, we don't need it
    Console.hide();

    // script should not run in global mode
    if (Parameters.isGlobalTarget) {
        Console.criticalln("Star Stretch could not run in global context.");
        return;
    }

    // perform the script on the target view
    if (Parameters.isViewTarget) {
        // load parameters
        StarStretchParameters.load();
        applyPixelMath(Parameters.targetView, StarStretchParameters.amount);

        if (!isGrayscale(Parameters.targetView)) {
            applyColorSaturation(Parameters.targetView, StarStretchParameters.satAmount); // Pass saturation amount
            applySCNR(Parameters.targetView);
        }

        console.show();
        console.noteln("Star Stretch Process Completed!");
        return;
    }

    // direct context, create and show the dialog
    let dialog = new StarStretchDialog;
    dialog.execute();

    // check if a valid target view has been selected
    if (StarStretchParameters.targetView && StarStretchParameters.targetView.id) {
        applyPixelMath(StarStretchParameters.targetView, StarStretchParameters.amount);

        if (!isGrayscale(StarStretchParameters.targetView)) {
            applyColorSaturation(StarStretchParameters.targetView, StarStretchParameters.satAmount); // Pass saturation amount
            applySCNR(StarStretchParameters.targetView);
        }

        console.show();
        console.noteln("Star Stretch Process Completed!");
    } else {
        Console.warningln("No target view is specified ");
    }
}

main();
