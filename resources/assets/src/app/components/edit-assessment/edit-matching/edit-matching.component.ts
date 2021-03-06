import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { UtilitiesService } from '../../../services/utilities.service';

@Component({
  selector: 'qc-edit-matching',
  templateUrl: './edit-matching.component.html',
  styleUrls: ['./edit-matching.component.scss']
})
export class EditMatchingComponent implements OnInit {
  @Input() question;
  @Input() readOnly;
  @Output() onQuestionEdited = new EventEmitter();
  @Output() onSavedOptionDeleted = new EventEmitter();

  constructor(public utilitiesService: UtilitiesService) { }

  ngOnInit() {
    this.initOptions();
    //when a new question is added, want to ensure validation is run immediately;
    //prevent a user from saving a new question without data added in.
    if (this.isInvalid()) {
      this.onEdited();
    }
  }

  ngOnChanges(changesObj) {
    if (changesObj.question) {
      this.question = changesObj.question.currentValue;
      this.initOptions();
    }
  }

  addDistractor() {
    var tempId = (this.question.options.length + 1).toString() + '-temp',
      distractor = {
        'id': tempId,
        'question_id': this.question.id,
        'option_text': '',
        'prompt_or_answer': 'answer',
        'matching_answer_text': ''
      };

    this.question.options.push(distractor);
    this.question.distractors.push(distractor);

    this.onEdited();

    //focus to this element after adding it
    setTimeout(() => {
      this.utilitiesService.focusToElement('#matching-distractor-' + this.question.id + '-' + tempId);
    }, 0, false);
  }

  addPrompt() {
    var tempId = (this.question.options.length + 1).toString() + '-temp',
      prompt = {
        'id': tempId,
        'question_id': this.question.id,
        'option_text': '',
        'prompt_or_answer': 'prompt',
        'matching_answer_text': ''
      };

    //for matching options, we create the prompt and a text input field for the answer,
    //with the model bound to prompt.matching_answer_text; in the backend, we create
    //the options that are answers according to this data, so basically, only prompts
    //are pushed from client to server, and server automatically makes answer options
    //based on the answers written in the text input box for each matching prompt.
    this.question.options.push(prompt);
    this.question.prompts.push(prompt);

    this.onEdited();

    //focus to this element after adding it
    setTimeout(() => {
      this.utilitiesService.focusToElement('#matching-prompt-' + this.question.id + '-' + tempId);
    }, 0, false);
  }

  deleteDistractor($event) {
    var distractor = $event.option,
      index = $event.index;

    //parent question component keeps track of all deleted options to pass to back-end
    if (distractor.id.toString().indexOf('temp') === -1) {
      this.onSavedOptionDeleted.emit({ option: distractor });
    }

    this.question.distractors.splice(index, 1);
    this.onEdited();
  }

  deletePrompt($event) {
    var prompt = $event.option,
      index = $event.index;

    //parent question component keeps track of all deleted options to pass to back-end
    if (prompt.id.toString().indexOf('temp') === -1) {
      this.onSavedOptionDeleted.emit({ option: prompt });
    }

    //we need to delete not only the prompt, but also its paired answer, if it exists
    //(if dealing with a distractor, no action necessary)
    if (this.isSavedPrompt(prompt)) {
      for (let [answerIndex, selectableAnswer] of this.question.selectableAnswers.entries()) {
        if (selectableAnswer.id == prompt.matching_answer_id) {
          this.onSavedOptionDeleted.emit({ option: selectableAnswer });
          this.question.selectableAnswers.splice(answerIndex, 1);
        }
      }
    }

    //delete prompt
    this.question.prompts.splice(index, 1);
    this.onEdited();
  }

  initOptions() {
    this.question.prompts = [];
    this.question.selectableAnswers = [];
    this.question.distractors = [];
    for (let qOption of this.question.options) {
      if (qOption.prompt_or_answer == 'prompt') {
        this.question.prompts.push(qOption);
      }
      else {
        this.question.selectableAnswers.push(qOption);
        if (this.isDistractor(qOption)) {
          this.question.distractors.push(qOption);
        }
      }
    }

    //Attach the answer ID to each prompt, so that when we're saving on the back-end,
    //if the text changes in the answer, we can still update it properly.
    //(The text input for the answer is bound to prompt.matching_answer_text
    //and if that text changes, the tie between prompt and answer is lost, since there
    //is no ID connecting them. A little clunky, but not sure how to better handle it.)
    for (let prompt of this.question.prompts) {
      for (let selectableAnswer of this.question.selectableAnswers) {
        if (prompt.matching_answer_text == selectableAnswer.option_text) {
          prompt.matching_answer_id = selectableAnswer.id;
        }
      }
    }
  }

  isDistractor(qOption) {
    var isDistractor = true;

    //if a prompt's answer matches this option's text, then it is a correct answer option and not a distractor
    for (let thisOption of this.question.options) {
      if (thisOption.prompt_or_answer === 'prompt' && thisOption.matching_answer_text && thisOption.matching_answer_text === qOption.option_text) {
        isDistractor = false;
      }
    }

    return isDistractor;
  }

  isInvalid() {
    if (this.question.prompts.length) {
      return false;
    }

    return 'No answer options were added to this question.';
  }

  isSavedPrompt(option) {
    if (option.matching_answer_id) {
      return true;
    }

    return false;
  }

  onEdited() {
    this.question.validationError = this.isInvalid();
    this.onQuestionEdited.emit({question: this.question});
  }

  onSubComponentEdited($event) {
    this.question = $event.question;
    this.onEdited();
  }
}
