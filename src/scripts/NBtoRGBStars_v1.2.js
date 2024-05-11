#feature-id NBtoRGBStars_v1.2 : Utilities > NB to RGB Star Combination
#feature-info This script performs a combination of NB stars only images and produces a realistic RGB star image.  It also has the option to perform a non-linear Star Stretch on the output.

#include <pjsr/Sizer.jsh>
#include <pjsr/NumericControl.jsh>

var SHOParameters = {
    HaView: undefined,
    OIIIView: undefined,
    SIIView: undefined, // Optional
    applyStarStretch: false, // Store the state of the star stretch feature
    stretchFactor: 5, // Default stretch factor
    colorBoost: 1.0, // Default value

    save: function() {
        Parameters.set("HaView", this.HaView ? this.HaView.id : "");
        Parameters.set("OIIIView", this.OIIIView ? this.OIIIView.id : "");
        Parameters.set("SIIView", this.SIIView ? this.SIIView.id : "");
        Parameters.set("applyStarStretch", this.applyStarStretch);
        Parameters.set("stretchFactor", this.stretchFactor);
        Parameters.set("colorBoost", this.colorBoost);
    },

    load: function() {
        if (Parameters.has("HaView"))
            this.HaView = ImageWindow.windowById(Parameters.getString("HaView")).mainView;
        if (Parameters.has("OIIIView"))
            this.OIIIView = ImageWindow.windowById(Parameters.getString("OIIIView")).mainView;
        if (Parameters.has("SIIView") && Parameters.getString("SIIView") !== "")
            this.SIIView = ImageWindow.windowById(Parameters.getString("SIIView")).mainView;
        if (Parameters.has("applyStarStretch"))
            this.applyStarStretch = Parameters.getBoolean("applyStarStretch");
        if (Parameters.has("stretchFactor"))
            this.stretchFactor = Parameters.getReal("stretchFactor");
        if (Parameters.has("colorBoost"))
            this.colorBoost = Parameters.getReal("colorBoost");
    }
};


function SHODialog() {
    this.__base__ = Dialog;
    this.__base__();

    this.userResizable = true;
    this.scaledMinWidth = 450;

    // Initialize the main sizer at the beginning of the dialog setup
    this.sizer = new VerticalSizer;
    this.sizer.margin = 8;
    this.sizer.spacing = 6;

    // Title setup
    this.title = new TextBox(this);
    this.title.text = "<b>NB to RGB Star Combination Tool v1.2</b><br>Select the H-alpha, OIII, and optionally SII star images for combination. If checked it will also perform a linear to non-linear Star Stretch on the output image.";
    this.title.readOnly = true;
    this.title.backgroundColor = 0xf7f7c625;
    this.title.minHeight = 80;
    this.title.maxHeight = 80;
    this.sizer.add(this.title);

    // Ha setup
    this.HaLabel = new Label(this);
    this.HaLabel.text = "Ha Stars Image:";
    this.HaViewList = new ViewList(this);
    this.HaViewList.getAll();
    this.HaViewList.onViewSelected = (view) => { SHOParameters.HaView = view; };
    this.HaViewList.maxWidth = 275; // Set the maximum width to 250 pixels

    this.HaSizer = new HorizontalSizer;
    this.HaSizer.add(this.HaLabel);
    this.HaSizer.add(this.HaViewList);
    this.sizer.add(this.HaSizer);

    // OIII setup
    this.OIIILabel = new Label(this);
    this.OIIILabel.text = "OIII Stars Image:";
    this.OIIIViewList = new ViewList(this);
    this.OIIIViewList.getAll();
    this.OIIIViewList.onViewSelected = (view) => { SHOParameters.OIIIView = view; };
    this.OIIIViewList.maxWidth = 275; // Set the maximum width to 250 pixels

    this.OIIISizer = new HorizontalSizer;
    this.OIIISizer.add(this.OIIILabel);
    this.OIIISizer.add(this.OIIIViewList);
    this.sizer.add(this.OIIISizer);

    // SII setup
    this.SIILabel = new Label(this);
    this.SIILabel.text = "SII Stars Image (optional):";
    this.SIIViewList = new ViewList(this);
    this.SIIViewList.getAll();
    this.SIIViewList.onViewSelected = (view) => { SHOParameters.SIIView = view; };
    this.SIIViewList.maxWidth = 275; // Set the maximum width to 250 pixels

    this.SIISizer = new HorizontalSizer;
    this.SIISizer.add(this.SIILabel);
    this.SIISizer.add(this.SIIViewList);
    this.sizer.add(this.SIISizer);

// Checkbox for Star Stretch
this.starStretchCheckBox = new CheckBox(this);
this.starStretchCheckBox.text = "Apply Star Stretch";
this.starStretchCheckBox.checked = false; // Start unchecked
this.starStretchCheckBox.toolTip = "Enable additional stretching and color saturation adjustments.";
this.starStretchCheckBox.onCheck = function(checked) {
    SHOParameters.applyStarStretch = checked;
    // Update visibility based on checkbox state
    this.dialog.stretchFactorControl.visible = checked;
    this.dialog.colorBoostControl.visible = checked;
}.bind(this);  // Ensure 'this' within the function refers to the dialog instance
this.sizer.add(this.starStretchCheckBox);

// NumericControl for stretchFactor
this.stretchFactorControl = new NumericControl(this);
this.stretchFactorControl.label.text = "Stretch Factor:";
this.stretchFactorControl.setRange(0, 8);
this.stretchFactorControl.slider.setRange(10, 100);
this.stretchFactorControl.setValue(5);
this.stretchFactorControl.setPrecision(2);
this.stretchFactorControl.onValueUpdated = function(value) {
    SHOParameters.stretchFactor = value;
};
this.stretchFactorControl.visible = false; // Initially hidden
this.sizer.add(this.stretchFactorControl);

// NumericControl for Color Boost
this.colorBoostControl = new NumericControl(this);
this.colorBoostControl.label.text = "Color Boost:";
this.colorBoostControl.setRange(0, 3); // Range from 0 to 2
this.colorBoostControl.slider.setRange(0, 300); // 200 steps
this.colorBoostControl.setValue(SHOParameters.colorBoost);
this.colorBoostControl.setPrecision(2);
this.colorBoostControl.onValueUpdated = function(value) {
    SHOParameters.colorBoost = value;
};
this.colorBoostControl.visible = false; // Initially hidden
this.sizer.add(this.colorBoostControl);


    // Authorship and website information
    this.authorshipLabel = new Label(this);
    this.authorshipLabel.text = "Written by Franklin Marek";
    this.authorshipLabel.textAlignment = TextAlign_Center;
    this.sizer.add(this.authorshipLabel);

    this.websiteLabel = new Label(this);
    this.websiteLabel.text = "www.setiastro.com";
    this.websiteLabel.textAlignment = TextAlign_Center;
    this.sizer.add(this.websiteLabel);

    // Button setup
    this.newInstanceButton = new ToolButton(this);
    this.newInstanceButton.icon = this.scaledResource(":/process-interface/new-instance.png");
    this.newInstanceButton.setScaledFixedSize(24, 24);
    this.newInstanceButton.toolTip = "New Instance";
    this.newInstanceButton.onMousePress = () => {
        SHOParameters.save();
        this.newInstance();
    };

    this.execButton = new PushButton(this);
    this.execButton.text = "Execute";
    this.execButton.onClick = () => {
        this.ok();
    };

    // Button sizer setup
    this.buttonSizer = new HorizontalSizer;
    this.buttonSizer.add(this.newInstanceButton);
    this.buttonSizer.addStretch();
    this.buttonSizer.add(this.execButton);
    this.sizer.add(this.buttonSizer);

    this.adjustToContents();
    this.setFixedSize();
}

SHODialog.prototype = new Dialog;





function main() {
    Console.show();

    if (Parameters.isGlobalTarget) {
        // Block execution in global context to prevent issues
        Console.criticalln("This script cannot run in a global context.");
        return;
    }

    // Allow dialog to open in both direct view and normal contexts
    let dialog = new SHODialog();
    if (dialog.execute()) {
        // Check if there is a selected view
        if (!SHOParameters.HaView || !SHOParameters.OIIIView) {
            Console.criticalln("Please ensure H-alpha and OIII images are selected.");
            return;
        }

        // Proceed with combining and adjusting the images
        let newImageId = combineNBtoRGB();
        if (newImageId) {
            applyAdjustments(newImageId);
            console.noteln("NB to RGB Stars Process Completed!");
        } else {
            Console.criticalln("Error creating the new image. Please check the settings.");
        }
    } else {
        Console.noteln("Dialog execution cancelled or closed without selection.");
    }
}


function processImages() {
    if (!SHOParameters.HaView || !SHOParameters.OIIIView) {
        Console.warningln("Please ensure H-alpha and OIII images are selected.");
        return;
    }

    let newImageId = combineNBtoRGB();
    if (newImageId) {
        applyAdjustments(newImageId);
        Console.noteln("NB to RGB Star Process Complete");
    } else {
        Console.criticalln("Error creating the new image. Please check the settings.");
    }

    Console.show();
}

function getAllImageIDs() {
    var windows = ImageWindow.windows;
    var ids = [];
    for (var i = 0; i < windows.length; ++i) {
        ids.push(windows[i].mainView.id);
    }
    return ids;
}

function findNewImageID(oldIDs, newIDs) {
    for (var i = 0; i < newIDs.length; i++) {
        var found = false;
        // Check if newIDs[i] is in oldIDs
        for (var j = 0; j < oldIDs.length; j++) {
            if (newIDs[i] === oldIDs[j]) {
                found = true;
                break;
            }
        }
        // If newIDs[i] was not found in oldIDs, return it
        if (!found) {
            return newIDs[i];
        }
    }
    return null; // Return null if no new ID is found
}



function combineNBtoRGB() {
    var oldIDs = getAllImageIDs(); // Get all image IDs before execution
    console.writeln("Old IDs: " + oldIDs.join(", "));  // Debug output to check IDs

    var P = new PixelMath;
    P.expression = "0.5*" + SHOParameters.HaView.id + " + 0.5*" + (SHOParameters.SIIView ? SHOParameters.SIIView.id : SHOParameters.HaView.id);
    P.expression1 = "0.3*" + SHOParameters.HaView.id + " + ~0.3*" + SHOParameters.OIIIView.id;
    P.expression2 = SHOParameters.OIIIView.id;
    P.expression3 = "";
    P.useSingleExpression = false;
    P.symbols = "";
    P.clearImageCacheAndExit = false;
    P.cacheGeneratedImages = false;
    P.generateOutput = true;
    P.singleThreaded = false;
    P.optimization = true;
    P.use64BitWorkingImage = false;
    P.rescale = false;
    P.rescaleLower = 0;
    P.rescaleUpper = 1;
    P.truncate = true;
    P.truncateLower = 0;
    P.truncateUpper = 1;
    P.createNewImage = true;
    P.showNewImage = true;
    P.newImageId = "NBtoRGB_stars";  // Let PixInsight handle suffixes automatically
    P.newImageWidth = 0; // Use existing width
    P.newImageHeight = 0; // Use existing height
    P.newImageAlpha = false;
    P.newImageColorSpace = PixelMath.prototype.RGB;
    P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;
    P.executeOn(SHOParameters.HaView);

    var newIDs = getAllImageIDs(); // Get all image IDs after execution
    console.writeln("Check newIDs after PixelMath: " + newIDs.join(", "));  // Debug output to check IDs
    var newImageId = findNewImageID(oldIDs, newIDs); // Determine the new image ID using the modified function

    return newImageId; // Return the actual new image ID created by PixelMath
}

function applyAdjustments(newImageId) {
    var targetView = ImageWindow.windowById(newImageId) ? ImageWindow.windowById(newImageId).mainView : null;
    if (!targetView) {
        Console.criticalln("Error: Image view not found for ID " + newImageId);
        return;
    }

    // Apply initial adjustments
    applySCNR(targetView);
    applyMTF(targetView);

    // Apply second SCNR to clean up any green noise introduced
    applySCNR(targetView);

    // Reverse the MTF adjustments to normalize the tone mapping
    reverseMTF(targetView);

    // Apply star stretch last if enabled
    if (SHOParameters.applyStarStretch) {
        applyStarStretch(targetView);
    }

    // Optionally, output a console message indicating completion of all adjustments
    Console.noteln("All adjustments including optional star stretch (if applied) are complete.");
}



function applySCNR(view) {
    var P = new SCNR;
    P.amount = 1.00;
    P.protectionMethod = SCNR.prototype.AverageNeutral;
    P.colorToRemove = SCNR.prototype.Green;
    P.preserveLightness = true;
    P.executeOn(view);
}

function applyMTF(view) {
    var P = new PixelMath;
    P.expression = "mtf(0.01, $T)";
    P.useSingleExpression = true;
    P.executeOn(view);
}

function reverseMTF(view) {
    var P = new PixelMath;
    P.expression = "mtf(~0.01, $T)";
    P.useSingleExpression = true;
    P.executeOn(view);
}

function applyStarStretch(view) {
    // Retrieve stretchFactor from SHOParameters
    var stretchFactor = SHOParameters.stretchFactor || 5; // Default to 5 if undefined
    var colorBoost = SHOParameters.colorBoost || 1.0; // Ensure a default value

    // Apply PixelMath for stretching
    var P = new PixelMath;
    P.expression = "((3^" + stretchFactor + ")*$T)/((3^" + stretchFactor + "-1)*$T+1)"; // Dynamic PixelMath formula using stretchFactor
    P.useSingleExpression = true;
    P.executeOn(view);

    // Apply ColorSaturation with the provided matrix
    var C = new ColorSaturation;
    C.HS = [
        [0.00000, colorBoost * 0.40000],
        [0.50000, colorBoost * 0.70000],
        [1.00000, colorBoost * 0.40000]
    ];
    C.HSt = ColorSaturation.prototype.AkimaSubsplines;
    C.hueShift = 0.000; // No hue shift by default

    C.executeOn(view);
}



main();
