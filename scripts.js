(function () {
    const modal = $('#modal');
    const modalTitle = $('.modal-title', modal);
    const modalBody = $('.modal-body', modal);
    const modalSaveButton = $('.save-modal-button', modal);
    const commentsListElement = $('#comments-list');
    const commentsSliderSettings = {
        arrows: false,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
    };

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

    function createFieldTemplate(fieldType, fieldName) {
        return `<div class="form-group">
                    <label for="name">${fieldName.split('-').join(' ')}</label>
                    ${fieldType === 'textarea' ?
            `<textarea name="${fieldName}" class="form-control" id="${fieldName}" cols="30" rows="2"></textarea>` :
            `<input type="text" class="form-control" id="${fieldName}">`}
                </div>`;
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

    function initForm(form) {
        form.on('focusout', function(e) {
            let field = e.target;
            if (field.tagName !== 'BUTTON') runChecks(field);
        });
    }

    function initAlert(message) {
        let alertElement = $('<div>').addClass('alert alert-success alert-dismissible')
            .append($('<button type="button" class="close" data-dismiss="alert">').append("&times;"))
            .append(message);

        $('body').append(alertElement);
        alertElement.alert();

        window.setTimeout(function() { alertElement.alert("close") }, 5000);
    }

    function initCommentsList(records) {
        commentsListElement.html('');
        records.reverse().forEach(function (record) {
            let newComment = createCommentTemplate(record);
            commentsListElement.append(newComment);

            if (record.comments.length > 0) {
                let subCommentsList = $('<div>').addClass('sub-comments-list p-2');
                $(`#${record.id}`).append(subCommentsList);

                record.comments.forEach(function(subComment) {
                    subCommentsList.append(createSubCommentTemplate(subComment));
                });

                subCommentsList.slick(commentsSliderSettings);
            }
        });
    }

    function initSearch() {
        let searchForm = $('#search');
        let searchButton = $('.search-button', searchForm);

        searchButton.on('click', function (e) {
            e.preventDefault();

            let nameToSearch = $('#search-field', searchForm).val();

            let filteredRecords = DB.getAllRecords().filter(function(record) {
                return record.author.includes(nameToSearch);
            });

            initCommentsList(filteredRecords);
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

    function initEditButtons() {
        $(document).on('click', '.edit-button', function() {
            let card = $(this).closest('.card');
            let id = card.attr('id');
            let record = DB.getAllRecords().filter(function(record) {
                return record.id === id;
            })[0];
            let editForm = $('<form>').attr('id', 'edit-form');
            modalBody.append(editForm);

            let messageField = createFieldTemplate('textarea', 'edit-message');
            editForm.append(messageField);

            let messageInput = $('#edit-message');
            messageInput.val(record.message);

            modal.modal('show');
            modalTitle.text('Edit comment');

            function saveEditedComment() {
                if (!validateForm(editForm)) return false;

                record.message = messageInput.val();
                record.editDate = new Date();
                let formattedEditDate = formatDate(record.editDate);
                let editDatePlace = $('.card-edit-date', card);

                $('.card-message', card).text(record.message);
                if (!editDatePlace) {
                    $('.card-footer', card).prepend(`<small class="card-edit-date">Edit date: ${formattedEditDate.time} ${formattedEditDate.date}</small>`);
                } else {
                    editDatePlace.text(`Edit date: ${formattedEditDate.time} ${formattedEditDate.date}`);
                }

                modalSaveButton.off('click', saveEditedComment);
                modal.modal('hide');
                modalBody.html('');
                modalTitle.text('');
                initAlert('comments update');

                DB.updateRecord(record);
            }

            modalSaveButton.on('click', saveEditedComment);
            modal.on('hidden.bs.modal', function () {
                modalSaveButton.off('click', saveEditedComment);
            });
        });
    }

    function initSubCommentAdding() {
        $(document).on('click', '.comment-button', function() {
            let card = $(this).closest('.card');
            let id = card.attr('id');
            let record = DB.getAllRecords().filter(function(record) {
                return record.id === id;
            })[0];
            let commentForm = $('<form>').attr('id', 'add-subcomment');
            let nameField = createFieldTemplate('input', 'comment-name');
            let messageField = createFieldTemplate('textarea', 'comment-message');

            commentForm.append(nameField);
            commentForm.append(messageField);
            modalBody.append(commentForm);

            console.log(commentForm);
            initForm(commentForm);

            let nameInput = $('#comment-name');
            let messageInput = $('#comment-message');

            modalTitle.text('Add comment');
            modal.modal('show');

            function addSubComment() {
                if (!validateForm(commentForm)) return false;

                let subComment = {};
                subComment.author = nameInput.val();
                subComment.message = messageInput.val();
                subComment.pubDate = new Date();
                let subCommentsList = $('.sub-comments-list', card).length ? $('.sub-comments-list', card) : $('<div>').addClass('sub-comments-list p-2');

                if (record.comments.length < 1) {
                    card.append(subCommentsList);
                    subCommentsList.append(createSubCommentTemplate(subComment));
                    subCommentsList.slick(commentsSliderSettings);
                } else {
                    subCommentsList.slick('slickAdd', createSubCommentTemplate(subComment));
                }

                modalSaveButton.off('click', addSubComment);
                modal.modal('hide');
                modalBody.html('');
                modalTitle.text('');
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

    function initCommentForm() {
        const commentForm = $('#add-comments');
        initForm(commentForm);

        commentForm.on('submit', function (e) {
            e.preventDefault();

            if (!validateForm(commentForm)) return false;

            let id = Math.random().toString(36).substr(2, 9);
            let author = $('#name', commentForm).val();
            let message = $('#message', commentForm).val();
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

            $('.form-control', commentForm).each(function(index, field) {
                $(field).val('');
            });
        });
    }

    initCommentsList(DB.getAllRecords());
    initCommentForm();
    initSearch();
    initDeleteButtons();
    initEditButtons();
    initSubCommentAdding();
}());
