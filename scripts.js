(function () {
    let modal = $('#modal');
    let modalBody = $('.modal-body', modal);
    let modalSaveButton = $('.save-modal-button', modal);

    modal.on('hidden.bs.modal', function () {
        modalBody.html('');
    });

    function formatDate(dateSource) {
        dateSource = dateSource instanceof Date ? dateSource : new Date(dateSource);
        let dateObj = {};

        dateObj.time = dateSource.toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        dateObj.date = dateSource.toLocaleString('ru-RU', {day: 'numeric', month: 'numeric', year: 'numeric'});

        return dateObj;
    }

    function createCommentTemplate(record) {
        let {id, author, message, pubDate, editDate} = record;
        pubDate = formatDate(pubDate);
        editDate = editDate ? formatDate(editDate) : null;

        return`<article class="card mb-2" id="${id}">
                    <div class="card-body">
                        <h3 class="cart-title">${author}</h3>
                        <p class="card-message">${message}</p>
                    </div>
                    <div class="card-footer">
                        ${editDate ? `<small class="card-edit-date">Edit date: ${editDate.time} ${editDate.date}</small>` : ''}
                        <small>Pub date: ${pubDate.time} ${pubDate.date}</small>
                        <button class="comment-button btn btn-secondary btn-sm">comments this</button>
                        <button class="edit-button btn btn-primary btn-sm">edit this</button>
                        <button class="delete-button btn btn-danger btn-sm">delete this</button>
                    </div>
                </article>`;
    }

    function createSubCommentTemplate(subComment) {
        let {author, message, pubDate} = subComment;
        pubDate = formatDate(pubDate);

        return `<article class="card">
                    <div class="card-body">
                        <h6>${author}</h6>
                        <p>${message}</p>
                    </div>
                    <div class="card-footer">
                        <small>Pub date: ${pubDate.time} ${pubDate.date}</small>
                    </div>
                </article>`;
    }

    function validateField(field, condition) {
        if (!condition) {
            $(field).addClass('is-invalid');
        } else {
            $(field).removeClass('is-invalid');
        }
    }

    function runChecks(field) {
        validateField(field, $(field).val().length);
    }

    function validateForm(form) {
        $('.form-control', $(form)).each(function(index, field) {
            runChecks(field);
        });

        return ($('.is-invalid', $(form)).length < 1);
    }

    function initAlert(message) {
        let alertElement = $('<div>').addClass('alert alert-success alert-dismissible')
            .append($('<button type="button" class="close" data-dismiss="alert">').append("&times;"))
            .append(message);

        $('body').append(alertElement);
        alertElement.alert();

        window.setTimeout(function() { alertElement.alert("close") }, 5000);
    }

    function initForm(selector) {
        let form = $(selector);

        form.on('focusout', function(e) {
            let field = e.target;
            if (field.tagName !== 'BUTTON') runChecks(field);

        });

        form.on('submit', function(e) {
            e.preventDefault();

            if (validateForm(form)) {
                let id = Math.random().toString(36).substr(2, 9);
                let author = $('#name', form).val();
                let message = $('#message', form).val();
                let pubDate = new Date();
                let record = {
                    id,
                    author,
                    message,
                    pubDate,
                    editDate: null,
                    comments: []
                };
                let newComment = createCommentTemplate(record);

                DB.addRecords(record);

                initAlert('thank for your comment');

                $('#comments-list').append(newComment);

                $('.form-control', form).each(function(index, field) { $(field).val(''); });
            }
        });
    }

    function initCommentsList() {
        let records = DB.getAllRecords();
        console.log(records);
        records.reverse().forEach(function (record) {
            let newComment = createCommentTemplate(record);
            $('#comments-list').append(newComment);

            if (record.comments.length > 0) {
                let subCommentsList = $('<div>').addClass('sub-comments-list p-2');
                $(`#${record.id}`).append(subCommentsList);

                record.comments.forEach(function(subComment) {
                    subCommentsList.append(createSubCommentTemplate(subComment));
                });
            }
        });
    }

    function initDeleteButtons() {
        $(document).on('click', '.delete-button', function() {
            let card = $(this).closest('.card');

            DB.deleteRecord(card.attr('id'));
            card.remove();
            initAlert('comments delete');
        });
    }

    function createFieldTemplate(fieldType, fieldName) {
        return `<div class="form-group">
                    <label for="name">${fieldName.split('-').join(' ')}</label>
                    ${fieldType === 'textarea' ? 
                    `<textarea name="${fieldName}" class="form-control" id="${fieldName}" cols="30" rows="2"></textarea>` :
                    `<input type="text" class="form-control" id="${fieldName}">`}
                </div>`;
    }

    function initEditButtons() {
        $(document).on('click', '.edit-button', function() {
            let card = $(this).closest('.card');
            let id = card.attr('id');
            let record = DB.getAllRecords().filter(function(record) {
                return record.id === id;
            })[0];
            let messageField = createFieldTemplate('textarea', 'edit-message');
            modalBody.append(messageField);

            let messageInput = $('#edit-message');
            messageInput.val(record.message);

            function saveEditedComment() {
                record.message = messageInput.val();
                record.editDate = new Date();
                let formattedEditDate = formatDate(record.editDate);
                let editDatePlace = $('.card-edit-date', card);

                $('.card-message',).text(record.message);
                if (!editDatePlace) {
                    $('.card-footer', card).prepend(`<small class="card-edit-date">Edit date: ${formattedEditDate.time} ${formattedEditDate.date}</small>`);
                } else {
                    editDatePlace.text(`Edit date: ${formattedEditDate.time} ${formattedEditDate.date}`);
                }

                modalSaveButton.off('click', saveEditedComment);
                modal.modal('hide');
                modalBody.html('');
                initAlert('comments update');

                DB.updateRecord(record);
            }

            modal.modal('show');
            modalSaveButton.on('click', saveEditedComment);
            modal.on('hidden.bs.modal', function () {
                modalSaveButton.off('click', saveEditedComment);
            });
        });
    }

    function initCommentAdding() {
        $(document).on('click', '.comment-button', function() {
            let card = $(this).closest('.card');
            let id = card.attr('id');
            let record = DB.getAllRecords().filter(function(record) {
                return record.id === id;
            })[0];
            let commentForm = $('<form>');
            let nameField = createFieldTemplate('input', 'comment-name');
            let messageField = createFieldTemplate('textarea', 'comment-message');

            commentForm.append(nameField);
            commentForm.append(messageField);
            modalBody.append(commentForm);

            let nameInput = $('#comment-name');
            let messageInput = $('#comment-message');

            modal.modal('show');

            function addSubComment() {
                let subComment = {};
                subComment.author = nameInput.val();
                subComment.message = messageInput.val();
                subComment.pubDate = new Date();
                let subCommentsList = $('.sub-comments-list').length ? $('.sub-comments-list') : $('<div>').addClass('sub-comments-list p-2');

                if (record.comments.length < 1) {
                    card.append(subCommentsList);
                }

                subCommentsList.append(createSubCommentTemplate(subComment));

                modalSaveButton.off('click', addSubComment);
                modal.modal('hide');
                modalBody.html('');
                initAlert('comments update');

                record.comments.push(subComment);
                DB.updateRecord(record);
            }

            modalSaveButton.on('click', addSubComment);
            modal.on('hidden.bs.modal', function () {
                modalSaveButton.off('click', addSubComment);
            });
        });
    }

    initCommentsList();
    initDeleteButtons();
    initEditButtons();
    initCommentAdding();

    initForm('#add-comments');

}());


