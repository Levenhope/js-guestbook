(function () {
    function formatDate(dateSource) {
        dateSource = dateSource instanceof Date ? dateSource : new Date(dateSource);
        let dateObj = {};

        dateObj.time = dateSource.toLocaleString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        dateObj.date = dateSource.toLocaleString('ru-RU', {day: 'numeric', month: 'numeric', year: 'numeric'});

        return dateObj;
    }

    function createCommentTemplate(id, author, message, pubDate, editDate) {
        pubDate = formatDate(pubDate);
        editDate = editDate ? formatDate(editDate) : null;

        return`<article class="card mb-2" id="${id}">
            <div class="card-body">
                <h3 class="cart-title">${author}</h3>
                <p>${message}</p>
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
                let newComment = createCommentTemplate(id, author, message, pubDate);

                // id - уникальный id записи
                // author {string} - имя автора записи
                // message {string} - текст записи
                // pubDate {Date} - дата создания записи
                // editDate {Date} - дата редактирования записи
                // comments {array} - массив комментариев к записи
                let record = {
                    id,
                    author,
                    message,
                    pubDate,
                    editDate: null,
                    comments: []
                };

                DB.addRecords(record);

                initAlert('thank for your comment');

                $('#comments-list').append(newComment);

                $('.form-control', form).each(function(index, field) { $(field).val(''); });
            }
        });
    }

    function initCommentsList() {
        let records = DB.getAllRecords();

        records.reverse().forEach(function (record) {
            let newComment = createCommentTemplate(record.id, record.author, record.message, record.pubDate, record.editDate);
            $('#comments-list').append(newComment);
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
            let editModal = $('#editModal');
            let messageField = $('#message-edit', editModal);

            messageField.val(record.message);

            $('#editModal').modal('show');

            $('.save-edit-button').on('click', function() {
                record.message = messageField.val();
                record.editDate = new Date();
                let formattedEditDate = formatDate(record.editDate);
                let editDatePlace = $('.card-edit-date', card);

                $('.card-body p', card).text(record.message);
                if (!editDatePlace) {
                    $('.card-footer', card).prepend(`<small class="card-edit-date">Edit date: ${formattedEditDate.time} ${formattedEditDate.date}</small>`);
                } else {
                    editDatePlace.text(`Edit date: ${formattedEditDate.time} ${formattedEditDate.date}`);
                }

                $('#editModal').modal('hide');
                initAlert('comments update');

                DB.updateRecord(record);
            });
        });
    }

    initCommentsList();
    initDeleteButtons();
    initEditButtons();

    initForm('#add-comments');

}());


