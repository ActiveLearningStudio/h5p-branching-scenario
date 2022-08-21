/**
 * Definition of which content types are read only
 */
var readOnlyActivities = [
  'H5P.Accordion',
  'H5P.Agamotto',
  'H5P.Audio',
  'H5P.AudioRecorder',
  'H5P.Chart',
  'H5P.Collage',
  'H5P.Dialogcards',
  'H5P.GuessTheAnswer',
  'H5P.Table',
  'H5P.IFrameEmbed',
  'H5P.Image',
  'H5P.ImageHotspots',
  'H5P.Link',
  'H5P.MemoryGame',
  'H5P.Timeline',
  'H5P.TwitterUserFeed',
  'H5P.Video',
  'H5P.PhetInteractiveSimulation',
  'H5P.DocumentationTool',
  'H5P.AdvancedText',
  'H5P.DocumentsUpload',
  'H5P.BranchingQuestion'
];

/**
 * Definition of which content types are tasks
 */
var isTasks = [
  'H5P.ImageHotspotQuestion',
  'H5P.Blanks',
  'H5P.Essay',
  'H5P.SingleChoiceSet',
  'H5P.MultiChoice',
  'H5P.TrueFalse',
  'H5P.DragQuestion',
  'H5P.Summary',
  'H5P.DragText',
  'H5P.MarkTheWords',
  'H5P.MemoryGame',
  'H5P.QuestionSet',
  'H5P.InteractiveVideo',
  'H5P.CoursePresentation',
  'H5P.DocumentationTool'
];


/**
 * Check if the given content instance is a task (will give a score)
 *
 * @param {Object} instance
 * @return {boolean}
 */
var isTask = function (instance) {
  if (instance.isTask !== undefined) {
    return instance.isTask; // Content will determine self if it's a task
  }

  // Go through the valid task names
  for (var i = 0; i < isTasks.length; i++) {
    // Check against library info. (instanceof is broken in H5P.newRunnable)
    if (instance.libraryInfo.machineName === isTasks[i]) {
      return true;
    }
  }

  return false;
};

/**
 * Check the instances all are only if read only return false and not show summary
 * if instance contain scorable or open response then return true
 * @returns {boolean}
 */
var isShowSummary = function (instances) {
  let hasNonReadOnlyActivities = false;
  for (const inst of instances) {
    const machineName = inst.libraryInfo.machineName;
    if (readOnlyActivities.includes(machineName)
        || (['H5P.InteractiveVideo', 'H5P.CoursePresentation'].includes(machineName) && !isTask(inst))) {
      continue;
    }
    hasNonReadOnlyActivities = true;
  }
  return hasNonReadOnlyActivities;
};


var createSummary = function (that, instances) {
  let tableContent = '<tbody>';
  let i = 0;
  for (const inst of instances) {
    // Do not show read only activities in summary
    const machineName = inst.libraryInfo.machineName;
    if (readOnlyActivities.includes(machineName)
        || (['H5P.InteractiveVideo', 'H5P.CoursePresentation'].includes(machineName) && !isTask(inst))) {
      i++;
      continue;
    }

    var custScore = 0;
    var custMaxScore = 0;
    if (typeof inst.getScore != "undefined") {
      custScore = inst.getScore();
      custMaxScore = inst.getMaxScore();
    }
    tableContent += '<tr>';
    tableContent += '<td>' + inst.metadata.title + '</td>';
    tableContent += '<td style="text-align:right;">' + custScore + '/' + custMaxScore + '</td>';
    tableContent += '</tr>';
    i++;
  }
  tableContent += '</tbody>';

  return '<div class="custom-summary-section"><div class="h5p-summary-table-pages"><table class="h5p-score-table-custom" style="min-height:100px;width:100%;"><thead><tr><th>Content</th><th style="text-align:right;">Score/Total</th></tr></thead>' + tableContent + '</table></div></div>';
};


var showSummary = function showSummary(that, screenData, contentDiv) {

  if (!screenData.isStartScreen && typeof that.parent.parent == "undefined" && isShowSummary(that.parent.instances)) {
    const viewSummaryButton = document.createElement('button');
    viewSummaryButton.classList.add('h5p-view-summary-button');

    const instances = that.parent.instances;
    viewSummaryButton.onclick = function () {
      H5P.jQuery('.submit-answers').remove();
      var confirmationDialog = new H5P.ConfirmationDialog({
        headerText: 'Branching Scenario Summary',
        dialogText: createSummary(that, instances),
        cancelText: 'Cancel',
        confirmText: "Submit Answers"
      });

      confirmationDialog.on('confirmed', function () {
        var rawwa = 0;
        var maxwa = 0;

        for (const inst of instances) {
          if(typeof inst != "undefined"){
            rawwa += inst.getScore();
            maxwa += inst.getMaxScore();
          }
        }

        if(maxwa === 0) {
          maxwa += 1;
        }
        that.triggerXAPIScored(rawwa, maxwa, 'submitted-curriki');
      });

      // if editor then show confirm only inside editor window
      /*const editor = document.querySelector('.h5peditor');
      if(editor) {
        confirmationDialog.appendTo(document.body);
      } else {
        confirmationDialog.appendTo(that.parent.document.body);
      }*/
      confirmationDialog.appendTo(document.body);
      confirmationDialog.show();
    };

    const buttonTextNode = document.createTextNode('View Summary');
    viewSummaryButton.appendChild(buttonTextNode);
    contentDiv.appendChild(viewSummaryButton);
  }

};


exports.showSummary = showSummary;
