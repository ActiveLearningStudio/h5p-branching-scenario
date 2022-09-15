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
  'H5P.DocumentsUpload'
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
        || (['H5P.InteractiveVideo', 'H5P.CoursePresentation'].includes(machineName) && !isTask(inst))
    ) {
      continue;
    }
    hasNonReadOnlyActivities = true;
  }
  return hasNonReadOnlyActivities;
};

var isScoringEnabled = function(that) {
  return that.scoring && that.scoring.shouldShowScore()
};

var createSummary = function (parent, instances, screenData) {
  console.log(parent);
  let tableContent = '<tbody>';
  if (parent.scoring.isStaticScoring()) {
    tableContent += '<tr>';
    tableContent += '<td>' + screenData.endScreenText + '</td>';
    tableContent += '<td style="text-align:right;">' + screenData.score + '/' +  screenData.maxScore + '</td>';
    tableContent += '</tr>';
  } else if (parent.scoring.isDynamicScoring()) {
    for (const score of parent.scoring.scores) {
      const subContentId = score.libraryParams.type.subContentId;
      const inst = instances.filter(i => i.subContentId === subContentId)[0];
      // Do not show read only activities in summary
      const machineName = inst.libraryInfo.machineName;
      if (readOnlyActivities.includes(machineName)
          || (['H5P.InteractiveVideo', 'H5P.CoursePresentation'].includes(machineName) && !isTask(inst))) {
        continue;
      }
      tableContent += '<tr>';
      tableContent += '<td>' + score.libraryParams.type.metadata.title + '</td>';
      tableContent += '<td style="text-align:right;">' + score.score + '/' + score.maxScore + '</td>';
      tableContent += '</tr>';
    }
  }

  tableContent += '</tbody>';

  return '<div class="custom-summary-section"><div class="h5p-summary-table-pages"><table class="h5p-score-table-custom" style="min-height:100px;width:100%;"><thead><tr><th>Content</th><th style="text-align:right;">Score/Total</th></tr></thead>' + tableContent + '</table></div></div>';
};


var showSummary = function showSummary(that, screenData, contentDiv) {

  if (!screenData.isStartScreen && typeof that.parent.parent == "undefined" && isScoringEnabled(that.parent) && isShowSummary(that.parent.instances)) {
    const viewSummaryButton = document.createElement('button');
    viewSummaryButton.classList.add('h5p-view-summary-button');

    const instances = that.parent.instances;
    const parent = that.parent;
    viewSummaryButton.onclick = function () {
      H5P.jQuery('.submit-answers').remove();
      var confirmationDialog = new H5P.ConfirmationDialog({
        headerText: 'Branching Scenario Summary',
        dialogText: createSummary(parent, instances, screenData),
        cancelText: 'Cancel',
        confirmText: "Submit Answers"
      });

      confirmationDialog.on('confirmed', function () {
        var rawwa = 0;
        var maxwa = 0;
        if (parent.scoring.isStaticScoring()) {
          rawwa += screenData.score;
          maxwa += screenData.maxScore;

          // for static scoring trigger answered
          var xAPIEvent = parent.createXAPIEventTemplate('answered');
          xAPIEvent.setScoredResult(rawwa, maxwa, parent);
          xAPIEvent.data.statement.result.response = screenData.endScreenText;
          parent.trigger(xAPIEvent);

        } else if (parent.scoring.isDynamicScoring()) {
          for (const score of parent.scoring.scores) {
            rawwa += score.score;
            maxwa += score.maxScore;
          }
        }

        if (maxwa === 0) {
          maxwa += 1;
        }
        parent.triggerXAPIScored(rawwa, maxwa, 'submitted-curriki');
      });

      confirmationDialog.appendTo(document.body);
      confirmationDialog.show();
    };

    const buttonTextNode = document.createTextNode('View Summary');
    viewSummaryButton.appendChild(buttonTextNode);
    contentDiv.appendChild(viewSummaryButton);
  }

};
exports.showSummary = showSummary;
